// Configuration
const API_URL = `http://${window.location.hostname}:3001/api/products`;

// State Management
const state = {
    stream: null,
    currentFacingMode: 'environment',
    isEditMode: false,
    backgroundImage: null,
    objects: [],
    selectedObject: null,
    products: [],
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    initialTouch: null,
    initialDistance: 0,
    initialAngle: 0,
    isMultiTouch: false,
    activeHandle: null, // 'rotate', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br', null
    handleDragStart: { x: 0, y: 0, objW: 0, objH: 0, objScale: 1, objRot: 0 }
};

// DOM Elements
const elements = {
    video: document.getElementById('videoElement'),
    canvas: document.getElementById('canvas'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    cameraControls: document.querySelector('.camera-controls'),
    editControls: document.getElementById('editControls'),
    captureBtn: document.getElementById('captureBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    switchBtn: document.getElementById('switchBtn'),
    fileInput: document.getElementById('fileInput'),
    retakeBtn: document.getElementById('retakeBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    bringForwardBtn: document.getElementById('bringForwardBtn'),
    sendBackwardBtn: document.getElementById('sendBackwardBtn'),
    resetTransformBtn: document.getElementById('resetTransformBtn'),
    exportBtn: document.getElementById('exportBtn'),
    drawer: document.getElementById('drawer'),
    drawerContent: document.getElementById('drawerContent'),
    searchInput: document.getElementById('searchInput'),
    helpBtn: document.getElementById('helpBtn'),
    helpModal: document.getElementById('helpModal'),
    closeHelp: document.getElementById('closeHelp'),
    touchOverlay: document.getElementById('touchOverlay')
};

// Canvas Context
let ctx = null;

// Initialize
async function init() {
    ctx = elements.canvas.getContext('2d');
    await loadProducts();
    setupEventListeners();
    await startCamera();
}

// Camera Functions
async function startCamera() {
    try {
        elements.loadingState.style.display = 'flex';
        elements.errorState.style.display = 'none';
        
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
        }

        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw { name: 'NotSupported', message: 'Camera API not supported' };
        }

        // Try with requested facing mode first
        let constraints = {
            video: {
                facingMode: state.currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            state.stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (firstError) {
            console.warn('⚠️ Failed with facingMode, trying without:', firstError.name);
            // Fallback: try without specific facing mode
            constraints = { video: true, audio: false };
            state.stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        elements.video.srcObject = state.stream;
        
        // Ensure video plays on all devices (especially iOS Safari)
        elements.video.setAttribute('playsinline', '');
        elements.video.setAttribute('autoplay', '');
        elements.video.setAttribute('muted', '');
        elements.video.muted = true;
        
        // Wait for video to be ready before playing
        await new Promise((resolve, reject) => {
            elements.video.onloadedmetadata = resolve;
            setTimeout(reject, 5000); // 5s timeout
        });
        
        await elements.video.play();
        
        elements.video.style.display = 'block';
        elements.loadingState.style.display = 'none';
        console.log('📹 Camera started successfully!');
    } catch (error) {
        console.error('Camera error:', error);
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'flex';
        
        if (error.name === 'NotAllowedError') {
            elements.errorMessage.innerHTML = 
                '<strong>Acces cameră refuzat</strong><br>' +
                '<small>Permite accesul la cameră în setările browserului.</small><br><br>' +
                '<button onclick="startCamera()" style="padding: 8px 20px; background: #c19a6b; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Încearcă din nou</button>';
        } else if (error.name === 'NotFoundError') {
            elements.errorMessage.innerHTML = 'Nu s-a găsit cameră.<br><small>Poți încărca o imagine în schimb.</small>';
        } else if (error.name === 'NotReadableError') {
            elements.errorMessage.innerHTML = 
                'Camera este folosită de altă aplicație.<br>' +
                '<small>Închide alte app-uri și încearcă din nou.</small><br><br>' +
                '<button onclick="startCamera()" style="padding: 8px 20px; background: #c19a6b; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Încearcă din nou</button>';
        } else if (error.name === 'NotSupported') {
            elements.errorMessage.innerHTML = 
                'Browserul nu suportă camera.<br>' +
                '<small>Folosește Chrome, Safari sau Firefox.</small><br><br>' +
                '<small>Poți încărca o imagine din galerie ↓</small>';
        } else {
            elements.errorMessage.innerHTML = 
                'Eroare la cameră.<br>' +
                '<small>' + (error.message || 'Eroare necunoscută') + '</small><br><br>' +
                '<button onclick="startCamera()" style="padding: 8px 20px; background: #c19a6b; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Încearcă din nou</button>';
        }
    }
}

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    elements.video.style.display = 'none';
}

function capturePhoto() {
    const videoWidth = elements.video.videoWidth;
    const videoHeight = elements.video.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
        alert('Eroare: Cameră neinițializată');
        return;
    }

    // Set canvas to video dimensions
    elements.canvas.width = videoWidth;
    elements.canvas.height = videoHeight;
    
    ctx.drawImage(elements.video, 0, 0, videoWidth, videoHeight);
    
    state.backgroundImage = elements.canvas.toDataURL('image/png');
    console.log('📸 Photo captured, canvas size:', elements.canvas.width, 'x', elements.canvas.height);
    enterEditMode();
}

function loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Set canvas to image dimensions
            elements.canvas.width = img.width;
            elements.canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            state.backgroundImage = elements.canvas.toDataURL('image/png');
            console.log('🖼️ Image loaded, canvas size:', elements.canvas.width, 'x', elements.canvas.height);
            enterEditMode();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Edit Mode
function enterEditMode() {
    console.log('🎬 Entering edit mode');
    state.isEditMode = true;
    stopCamera();
    
    elements.canvas.style.display = 'block';
    elements.canvas.style.touchAction = 'none'; // ALWAYS none in edit mode
    elements.canvas.style.pointerEvents = 'auto'; // Ensure events work
    elements.canvas.style.userSelect = 'none';
    elements.canvas.style.webkitUserSelect = 'none';
    
    elements.cameraControls.style.display = 'none';
    elements.editControls.style.display = 'flex';
    elements.drawer.classList.add('open');
    
    console.log('📐 Canvas dimensions:', elements.canvas.width, 'x', elements.canvas.height);
    console.log('🖼️ Canvas display:', elements.canvas.style.display);
    console.log('🔧 Edit mode active:', state.isEditMode);
    
    renderCanvas();
}

function exitEditMode() {
    state.isEditMode = false;
    state.objects = [];
    state.selectedObject = null;
    state.backgroundImage = null;
    elements.canvas.style.display = 'none';
    elements.cameraControls.style.display = 'flex';
    elements.editControls.style.display = 'none';
    elements.drawer.classList.remove('open');
    updateTransformButtons();
    startCamera();
}

// Product Loading
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to load products');
        
        state.products = await response.json();
        renderProducts(state.products);
    } catch (error) {
        console.error('Error loading products:', error);
        elements.drawerContent.innerHTML = `
            <div class="error-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p>Nu s-au putut încărca produsele</p>
            </div>
        `;
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        elements.drawerContent.innerHTML = `
            <div class="products-loading">
                <p style="color: var(--text-secondary);">Nu există produse disponibile</p>
            </div>
        `;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'products-grid';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addProductToCanvas(product);
        
        card.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price.toLocaleString('ro-RO')} MDL</div>
        `;
        
        grid.appendChild(card);
    });
    
    elements.drawerContent.innerHTML = '';
    elements.drawerContent.appendChild(grid);
}

function filterProducts(searchTerm) {
    const filtered = state.products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderProducts(filtered);
}

// Canvas Object Management
function addProductToCanvas(product) {
    if (!state.isEditMode) {
        console.log('❌ Not in edit mode');
        return;
    }
    
    console.log('➕ Adding product to canvas:', product.name);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const maxSize = Math.min(elements.canvas.width, elements.canvas.height) * 0.3;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        
        const obj = {
            id: Date.now(),
            image: img,
            x: elements.canvas.width / 2,
            y: elements.canvas.height / 2,
            width: img.width * scale,
            height: img.height * scale,
            rotation: 0,
            scale: 1,
            product: product
        };
        
        state.objects.push(obj);
        state.selectedObject = obj;
        updateTransformButtons();
        console.log('✅ Product added, total objects:', state.objects.length);
        console.log('📍 Object position:', obj.x, obj.y, 'size:', obj.width, obj.height);
        renderCanvas();
    };
    img.src = product.images[0];
}

// Cache background image
let cachedBgImg = null;

function renderCanvas() {
    if (!state.backgroundImage || !ctx) {
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Load background only once
    if (!cachedBgImg) {
        cachedBgImg = new Image();
        cachedBgImg.src = state.backgroundImage;
    }
    
    // Draw background if loaded
    if (cachedBgImg.complete && cachedBgImg.naturalWidth > 0) {
        ctx.drawImage(cachedBgImg, 0, 0, elements.canvas.width, elements.canvas.height);
    }
    
    // Draw all objects
    drawObjects();
}

function drawObjects() {
    state.objects.forEach((obj) => {
        ctx.save();
        
        // Position and transform
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.scale(obj.scale, obj.scale);
        
        // Draw image
        try {
            ctx.drawImage(obj.image, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
        } catch (e) {
            console.error('Error drawing object:', e);
        }
        
        // Selection border + handles (Word-style with 8 handles)
        if (obj === state.selectedObject) {
            const hw = obj.width / 2;
            const hh = obj.height / 2;
            const handleSize = 12 / obj.scale; // Fixed size handles
            const rotateHandleOffset = 40 / obj.scale;
            
            // Border - stronger outline like in reference image
            ctx.strokeStyle = '#ff9800'; // Orange/gold like in reference
            ctx.lineWidth = 3 / obj.scale;
            ctx.strokeRect(-hw, -hh, obj.width, obj.height);
            
            // Handle style
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2 / obj.scale;
            
            // 8 resize handles: 4 corners + 4 sides
            const handles = [
                { x: -hw, y: -hh },      // top-left
                { x: 0, y: -hh },        // top-center
                { x: hw, y: -hh },       // top-right
                { x: hw, y: 0 },         // middle-right
                { x: hw, y: hh },        // bottom-right
                { x: 0, y: hh },         // bottom-center
                { x: -hw, y: hh },       // bottom-left
                { x: -hw, y: 0 }         // middle-left
            ];
            
            handles.forEach(handle => {
                ctx.beginPath();
                // Draw as small squares for better visibility
                ctx.rect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
                ctx.fill();
                ctx.stroke();
            });
            
            // Rotation handle (above, center) - circular and green
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2 / obj.scale;
            ctx.beginPath();
            ctx.moveTo(0, -hh);
            ctx.lineTo(0, -hh - rotateHandleOffset);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, -hh - rotateHandleOffset, handleSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#4CAF50'; // Green for rotate
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / obj.scale;
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

// Check if clicking on a handle of selected object
function getHandleAtPosition(x, y) {
    if (!state.selectedObject) return null;
    
    const obj = state.selectedObject;
    const dx = x - obj.x;
    const dy = y - obj.y;
    
    // Rotate point back to object's local space
    const angleRad = -obj.rotation * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    const hw = (obj.width * obj.scale) / 2;
    const hh = (obj.height * obj.scale) / 2;
    const handleSize = 20; // Click tolerance
    const rotateHandleOffset = 40;
    
    // Check rotation handle (top center)
    const rotHandleX = 0;
    const rotHandleY = -hh - rotateHandleOffset;
    if (Math.abs(localX - rotHandleX) < handleSize && Math.abs(localY - rotHandleY) < handleSize) {
        return 'rotate';
    }
    
    // Check all 8 resize handles: 4 corners + 4 sides
    const handles = [
        { x: -hw, y: -hh, handle: 'resize-tl' },     // top-left
        { x: 0, y: -hh, handle: 'resize-t' },        // top-center
        { x: hw, y: -hh, handle: 'resize-tr' },      // top-right
        { x: hw, y: 0, handle: 'resize-r' },         // middle-right
        { x: hw, y: hh, handle: 'resize-br' },       // bottom-right
        { x: 0, y: hh, handle: 'resize-b' },         // bottom-center
        { x: -hw, y: hh, handle: 'resize-bl' },      // bottom-left
        { x: -hw, y: 0, handle: 'resize-l' }         // middle-left
    ];
    
    for (const h of handles) {
        if (Math.abs(localX - h.x) < handleSize && Math.abs(localY - h.y) < handleSize) {
            return h.handle;
        }
    }
    
    return null;
}

function getObjectAtPosition(x, y) {
    if (state.objects.length === 0) return null;
    
    console.log('🎯 Checking click at', Math.round(x), ',', Math.round(y));
    
    // Check from top to bottom (last object is on top)
    for (let i = state.objects.length - 1; i >= 0; i--) {
        const obj = state.objects[i];
        
        // Vector from click to object center
        const dx = x - obj.x;
        const dy = y - obj.y;
        
        // Rotate back to object's local space
        const angleRad = -obj.rotation * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        // Object bounds (accounting for scale)
        const halfW = (obj.width * obj.scale) / 2;
        const halfH = (obj.height * obj.scale) / 2;
        
        // Add padding for easier clicking
        const padding = 10;
        
        const isHit = Math.abs(localX) <= (halfW + padding) && 
                     Math.abs(localY) <= (halfH + padding);
        
        console.log(`  [${i}] ${obj.product.name}:`, {
            objPos: `(${Math.round(obj.x)}, ${Math.round(obj.y)})`,
            clickPos: `(${Math.round(x)}, ${Math.round(y)})`,
            localPos: `(${Math.round(localX)}, ${Math.round(localY)})`,
            bounds: `±${Math.round(halfW)}, ±${Math.round(halfH)}`,
            hit: isHit
        });
        
        if (isHit) {
            console.log('✅ HIT:', obj.product.name);
            return obj;
        }
    }
    
    console.log('❌ No hit');
    return null;
}

function deleteSelectedObject() {
    if (!state.selectedObject) return;
    
    const index = state.objects.indexOf(state.selectedObject);
    if (index > -1) {
        state.objects.splice(index, 1);
        state.selectedObject = null;
        elements.deleteBtn.disabled = true;
        updateTransformButtons();
        renderCanvas();
    }
}

function bringForward() {
    if (!state.selectedObject) return;
    
    const index = state.objects.indexOf(state.selectedObject);
    if (index < state.objects.length - 1) {
        // Swap with next object
        [state.objects[index], state.objects[index + 1]] = [state.objects[index + 1], state.objects[index]];
        renderCanvas();
        console.log('⬆️ Brought forward');
    }
}

function sendBackward() {
    if (!state.selectedObject) return;
    
    const index = state.objects.indexOf(state.selectedObject);
    if (index > 0) {
        // Swap with previous object
        [state.objects[index], state.objects[index - 1]] = [state.objects[index - 1], state.objects[index]];
        renderCanvas();
        console.log('⬇️ Sent backward');
    }
}

function resetTransform() {
    if (!state.selectedObject) return;
    
    state.selectedObject.scale = 1;
    state.selectedObject.rotation = 0;
    renderCanvas();
    console.log('🔄 Transform reset');
}

function updateTransformButtons() {
    const hasSelection = state.selectedObject !== null;
    if (elements.deleteBtn) elements.deleteBtn.disabled = !hasSelection;
    if (elements.bringForwardBtn) elements.bringForwardBtn.disabled = !hasSelection;
    if (elements.sendBackwardBtn) elements.sendBackwardBtn.disabled = !hasSelection;
    if (elements.resetTransformBtn) elements.resetTransformBtn.disabled = !hasSelection;
}

// Export
function exportImage() {
    const link = document.createElement('a');
    link.download = `luxmobila-tryroom-${Date.now()}.png`;
    link.href = elements.canvas.toDataURL('image/png');
    link.click();
}

// Touch/Mouse Events
function setupEventListeners() {
    // Camera controls
    elements.captureBtn.addEventListener('click', capturePhoto);
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            loadImageFromFile(e.target.files[0]);
        }
    });
    elements.switchBtn.addEventListener('click', () => {
        state.currentFacingMode = state.currentFacingMode === 'environment' ? 'user' : 'environment';
        startCamera();
    });
    
    // Edit controls
    elements.retakeBtn.addEventListener('click', exitEditMode);
    elements.deleteBtn.addEventListener('click', deleteSelectedObject);
    if (elements.bringForwardBtn) elements.bringForwardBtn.addEventListener('click', bringForward);
    if (elements.sendBackwardBtn) elements.sendBackwardBtn.addEventListener('click', sendBackward);
    if (elements.resetTransformBtn) elements.resetTransformBtn.addEventListener('click', resetTransform);
    elements.exportBtn.addEventListener('click', exportImage);
    
    // Transform controls removed - now visual handles on canvas
    
    // Search
    elements.searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
    
    // Drawer
    let drawerStartY = 0;
    let drawerCurrentY = 0;
    let drawerTouchStarted = false;
    let drawerDragging = false;
    
    const drawerHeader = elements.drawer.querySelector('.drawer-header');
    const drawerHandle = elements.drawer.querySelector('.drawer-handle');
    
    // Function to start drawer drag (touch or mouse)
    const startDrawerDrag = (e) => {
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        drawerStartY = clientY;
        drawerTouchStarted = true;
        drawerDragging = true;
        console.log('🎯 Started dragging drawer from Y:', drawerStartY);
    };
    
    // Function to move drawer (touch or mouse)
    const moveDrawerDrag = (e) => {
        if (!drawerTouchStarted || !drawerDragging) return;
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        drawerCurrentY = clientY;
        const diff = drawerCurrentY - drawerStartY;
        
        if (diff > 50 && elements.drawer.classList.contains('open')) {
            // Close drawer when dragged down more than 50px
            elements.drawer.classList.remove('open');
            drawerDragging = false;
            console.log('👇 Closed drawer (dragged down)');
        } else if (diff < -50 && !elements.drawer.classList.contains('open')) {
            // Open drawer when dragged up more than 50px
            elements.drawer.classList.add('open');
            drawerDragging = false;
            console.log('👆 Opened drawer (dragged up)');
        }
    };
    
    // Function to end drawer drag
    const endDrawerDrag = () => {
        drawerTouchStarted = false;
        drawerDragging = false;
    };
    
    // Click to toggle drawer - on handle
    drawerHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.drawer.classList.toggle('open');
    });
    
    // Click to toggle drawer - on header (but not on search input)
    drawerHeader.addEventListener('click', (e) => {
        if (e.target !== elements.searchInput && !drawerDragging) {
            e.stopPropagation();
            elements.drawer.classList.toggle('open');
        }
    });
    
    // Touch drag drawer - from handle and header
    drawerHandle.addEventListener('touchstart', startDrawerDrag, { passive: true });
    drawerHandle.addEventListener('touchmove', moveDrawerDrag, { passive: true });
    drawerHandle.addEventListener('touchend', endDrawerDrag);
    
    drawerHeader.addEventListener('touchstart', (e) => {
        if (e.target !== elements.searchInput) {
            startDrawerDrag(e);
        }
    }, { passive: true });
    
    drawerHeader.addEventListener('touchmove', moveDrawerDrag, { passive: true });
    drawerHeader.addEventListener('touchend', endDrawerDrag);
    
    // Mouse drag drawer - from handle and header (for desktop)
    drawerHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrawerDrag(e);
        
        const mouseMoveHandler = (e) => moveDrawerDrag(e);
        const mouseUpHandler = () => {
            endDrawerDrag();
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
    
    drawerHeader.addEventListener('mousedown', (e) => {
        if (e.target !== elements.searchInput) {
            e.preventDefault();
            startDrawerDrag(e);
            
            const mouseMoveHandler = (e) => moveDrawerDrag(e);
            const mouseUpHandler = () => {
                endDrawerDrag();
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };
            
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        }
    });
    
    // Canvas interactions - Desktop
    elements.canvas.addEventListener('mousedown', handleMouseDown, false);
    elements.canvas.addEventListener('mousemove', handleMouseMove, false);
    elements.canvas.addEventListener('mouseup', handleMouseUp, false);
    elements.canvas.addEventListener('mouseleave', handleMouseUp, false); // Handle mouse leaving canvas
    elements.canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Canvas interactions - Mobile (passive: false allows preventDefault)
    elements.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    elements.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // Help modal
    elements.helpBtn.addEventListener('click', () => elements.helpModal.classList.add('show'));
    elements.closeHelp.addEventListener('click', () => elements.helpModal.classList.remove('show'));
    elements.helpModal.addEventListener('click', (e) => {
        if (e.target === elements.helpModal) {
            elements.helpModal.classList.remove('show');
        }
    });
}

// Mouse Events
function handleMouseDown(e) {
    if (!state.isEditMode) return;
    
    const rect = elements.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (elements.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (elements.canvas.height / rect.height);
    
    // Check handles first
    const handle = getHandleAtPosition(x, y);
    if (handle) {
        e.preventDefault();
        console.log('🎯 Grabbed handle:', handle);
        state.activeHandle = handle;
        state.isDragging = false;
        state.handleDragStart = {
            x: x,
            y: y,
            objW: state.selectedObject.width,
            objH: state.selectedObject.height,
            objScale: state.selectedObject.scale,
            objRot: state.selectedObject.rotation,
            objX: state.selectedObject.x,
            objY: state.selectedObject.y
        };
        elements.canvas.style.cursor = handle === 'rotate' ? 'crosshair' : 'nwse-resize';
        renderCanvas();
        return;
    }
    
    // Then check object body
    const obj = getObjectAtPosition(x, y);
    
    if (obj) {
        e.preventDefault();
        // Bring to front when selected
        const index = state.objects.indexOf(obj);
        if (index !== state.objects.length - 1) {
            state.objects.splice(index, 1);
            state.objects.push(obj);
        }
        state.selectedObject = obj;
        state.isDragging = true;
        state.activeHandle = null;
        state.dragStart = { x: x - obj.x, y: y - obj.y };
        updateTransformButtons();
        elements.canvas.style.cursor = 'grabbing';
        console.log('✋ Started dragging:', obj.product.name);
        renderCanvas();
    } else {
        // Click on empty space - deselect
        console.log('⚪ Empty space clicked - deselect');
        state.selectedObject = null;
        state.isDragging = false;
        state.activeHandle = null;
        updateTransformButtons();
        elements.canvas.style.cursor = 'auto';
        renderCanvas();
    }
}

function handleMouseMove(e) {
    const rect = elements.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (elements.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (elements.canvas.height / rect.height);
    
    if (!state.isDragging && !state.activeHandle) {
        // Update cursor when hovering
        const handle = getHandleAtPosition(x, y);
        if (handle) {
            // Set cursor based on handle type
            if (handle === 'rotate') {
                elements.canvas.style.cursor = 'crosshair';
            } else if (handle.includes('t') || handle.includes('b') && !handle.includes('l') && !handle.includes('r')) {
                elements.canvas.style.cursor = 'ns-resize'; // top/bottom
            } else if (handle.includes('l') || handle.includes('r') && !handle.includes('t') && !handle.includes('b')) {
                elements.canvas.style.cursor = 'ew-resize'; // left/right
            } else {
                elements.canvas.style.cursor = 'nwse-resize'; // corners
            }
        } else {
            const obj = getObjectAtPosition(x, y);
            elements.canvas.style.cursor = obj ? 'grab' : 'auto';
        }
        return;
    }
    
    if (!state.selectedObject) return;
    e.preventDefault();
    
    if (state.activeHandle) {
        // Handle dragging
        const obj = state.selectedObject;
        
        if (state.activeHandle === 'rotate') {
            const dx = x - obj.x;
            const dy = y - obj.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            obj.rotation = angle + 90;
        } else if (state.activeHandle.startsWith('resize')) {
            // For corner handles: proportional scaling
            if (state.activeHandle.length > 8) { // corner handles like 'resize-tl'
                const startDist = Math.sqrt(
                    Math.pow(state.handleDragStart.x - state.handleDragStart.objX, 2) +
                    Math.pow(state.handleDragStart.y - state.handleDragStart.objY, 2)
                );
                const currentDist = Math.sqrt(
                    Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
                );
                const scaleFactor = currentDist / startDist;
                obj.scale = Math.max(0.1, Math.min(10, state.handleDragStart.objScale * scaleFactor));
            } else {
                // For side handles: proportional scaling (simplified - you can make it non-proportional if desired)
                const startDist = Math.sqrt(
                    Math.pow(state.handleDragStart.x - state.handleDragStart.objX, 2) +
                    Math.pow(state.handleDragStart.y - state.handleDragStart.objY, 2)
                );
                const currentDist = Math.sqrt(
                    Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
                );
                const scaleFactor = currentDist / startDist;
                obj.scale = Math.max(0.1, Math.min(10, state.handleDragStart.objScale * scaleFactor));
            }
        }
        renderCanvas();
    } else if (state.isDragging) {
        // Object drag
        state.selectedObject.x = x - state.dragStart.x;
        state.selectedObject.y = y - state.dragStart.y;
        renderCanvas();
    }
}

function handleMouseUp() {
    if (state.isDragging || state.activeHandle) {
        console.log('🖱️ Mouse Up - stopped', state.isDragging ? 'dragging' : 'handle');
        console.log('✅ Selection KEPT:', state.selectedObject?.product?.name || 'none');
        state.isDragging = false;
        state.activeHandle = null;
        elements.canvas.style.cursor = state.selectedObject ? 'grab' : 'auto';
        // CRITICAL: Re-render to show selection persists with handles
        renderCanvas();
    }
}

function handleWheel(e) {
    if (!state.isEditMode || !state.selectedObject) return;
    e.preventDefault();
    
    // Zoom (scroll) or Rotate (shift + scroll)
    if (e.shiftKey) {
        // Rotate with shift
        const amount = e.deltaY > 0 ? 5 : -5;
        state.selectedObject.rotation += amount;
        console.log('🔄 Rotating:', amount, 'degrees');
    } else {
        // Zoom/scale
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = state.selectedObject.scale * factor;
        state.selectedObject.scale = Math.max(0.1, Math.min(15, newScale));
        console.log('🔍 Zoom:', Math.round(state.selectedObject.scale * 100) + '%');
    }
    
    renderCanvas();
}

// Touch Events
function handleTouchStart(e) {
    if (!state.isEditMode) {
        console.log('❌ Not in edit mode');
        return;
    }
    
    // ALWAYS prevent default in edit mode on canvas to stop browser scroll/zoom
    e.preventDefault();
    e.stopPropagation();
    
    const touchCount = e.touches.length;
    console.log('👆 Touch Start, fingers:', touchCount);
    
    const rect = elements.canvas.getBoundingClientRect();
    
    if (touchCount === 1) {
        // Single touch - check for handles first, then object body
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (elements.canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (elements.canvas.height / rect.height);
        
        console.log('👆 Touch at', Math.round(x), Math.round(y));
        
        // Check if clicking on a handle
        const handle = getHandleAtPosition(x, y);
        if (handle) {
            console.log('🎯 Grabbed handle:', handle);
            state.activeHandle = handle;
            state.isDragging = false;
            state.handleDragStart = {
                x: x,
                y: y,
                objW: state.selectedObject.width,
                objH: state.selectedObject.height,
                objScale: state.selectedObject.scale,
                objRot: state.selectedObject.rotation,
                objX: state.selectedObject.x,
                objY: state.selectedObject.y
            };
            renderCanvas();
            return;
        }
        
        // Check if clicking on object body
        const obj = getObjectAtPosition(x, y);
        
        if (obj) {
            console.log('✅ Hit object:', obj.product.name, '- KEEPING SELECTION');
            // Bring to front when selected
            const index = state.objects.indexOf(obj);
            if (index !== state.objects.length - 1) {
                state.objects.splice(index, 1);
                state.objects.push(obj);
            }
            state.selectedObject = obj;
            state.isDragging = true;
            state.activeHandle = null;
            state.dragStart = { x: x - obj.x, y: y - obj.y };
            state.isMultiTouch = false;
            updateTransformButtons();
            console.log('🎯 Ready to drag:', obj.product.name);
            renderCanvas();
        } else {
            console.log('⚪ Empty space touched - deselect');
            state.selectedObject = null;
            state.isDragging = false;
            state.activeHandle = null;
            state.isMultiTouch = false;
            updateTransformButtons();
            renderCanvas();
        }
    } else if (touchCount === 2) {
        // Two fingers - pinch/rotate
        console.log('✌️ Two-finger gesture detected');
        state.isDragging = false;
        state.isMultiTouch = true;
        
        if (state.selectedObject) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            
            state.initialDistance = Math.sqrt(dx * dx + dy * dy);
            state.initialAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            state.initialTouch = {
                scale: state.selectedObject.scale,
                rotation: state.selectedObject.rotation
            };
            console.log('📏 Initial distance:', Math.round(state.initialDistance), 'pixels');
        }
    }
}

function handleTouchMove(e) {
    if (!state.isEditMode) return;
    
    // ALWAYS prevent default in edit mode
    e.preventDefault();
    e.stopPropagation();
    
    const rect = elements.canvas.getBoundingClientRect();
    const touchCount = e.touches.length;
    
    if (touchCount === 1 && state.selectedObject) {
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (elements.canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (elements.canvas.height / rect.height);
        
        if (state.activeHandle) {
            // Handle dragging (resize or rotate)
            const obj = state.selectedObject;
            
            if (state.activeHandle === 'rotate') {
                // Rotation: calculate angle from object center to current position
                const dx = x - obj.x;
                const dy = y - obj.y;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                obj.rotation = angle + 90; // +90 because handle is at top
                console.log('🔄 Rotating:', Math.round(obj.rotation), '°');
            } else if (state.activeHandle.startsWith('resize')) {
                // Resize: calculate scale based on distance from center
                const startDist = Math.sqrt(
                    Math.pow(state.handleDragStart.x - state.handleDragStart.objX, 2) +
                    Math.pow(state.handleDragStart.y - state.handleDragStart.objY, 2)
                );
                const currentDist = Math.sqrt(
                    Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
                );
                const scaleFactor = currentDist / startDist;
                obj.scale = Math.max(0.1, Math.min(10, state.handleDragStart.objScale * scaleFactor));
                console.log('📏 Resizing:', obj.scale.toFixed(2));
            }
            
            renderCanvas();
        } else if (state.isDragging) {
            // Object body drag
            state.selectedObject.x = x - state.dragStart.x;
            state.selectedObject.y = y - state.dragStart.y;
            renderCanvas();
        }
    } else if (touchCount === 2 && state.selectedObject && state.initialTouch) {
        // Pinch to zoom/rotate
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Scale
        const scaleFactor = distance / state.initialDistance;
        const newScale = state.initialTouch.scale * scaleFactor;
        state.selectedObject.scale = Math.max(0.1, Math.min(10, newScale));
        
        // Rotate
        const rotationDelta = angle - state.initialAngle;
        state.selectedObject.rotation = state.initialTouch.rotation + rotationDelta;
        
        renderCanvas();
    }
}

function handleTouchEnd(e) {
    // Always prevent default in edit mode
    if (state.isEditMode) {
        e.preventDefault();
    }
    
    const touchCount = e.touches.length;
    console.log('👆 Touch End, remaining:', touchCount, '| selected:', state.selectedObject?.product?.name || 'none');
    
    if (touchCount === 0) {
        // All fingers lifted - stop drag but KEEP selection
        state.isDragging = false;
        state.activeHandle = null;
        state.initialTouch = null;
        state.isMultiTouch = false;
        console.log('✅ All fingers up. Selection KEPT:', state.selectedObject?.product?.name || 'none');
        // CRITICAL: Re-render to show selection persists with handles
        renderCanvas();
    } else if (touchCount === 1) {
        // One finger remaining after lifting second
        state.initialTouch = null;
        state.isMultiTouch = false;
        state.isDragging = false;
        console.log('⚠️ One finger remains. Selection KEPT:', state.selectedObject?.product?.name || 'none');
    }
    // NEVER reset touch-action or selectedObject here!
}

// Start the app
init();
