import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, RotateCw, Trash2, Download, HelpCircle, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '../lib/api';

interface Product {
  id: number;
  name: string;
  translations?: {
    en?: {
      name?: string;
    };
    ru?: {
      name?: string;
    };
  };
  price: number;
  images: string[];
  category: string;
  inStock?: boolean;
  colorVariants?: {
    name: string;
    hexCode: string;
    images: string[];
    inStock: boolean;
  }[];
}

interface CanvasObject {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  product: Product;
}

type HandleType =
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'rotate-t'
  | 'rotate-r'
  | 'rotate-b'
  | 'rotate-l';

const TryInMyRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode] = useState<'environment' | 'user'>('environment');
  const [showCamera, setShowCamera] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const categoryLabelMap = useMemo(() => ({
    living: t('products.categories.living'),
    dormitor: t('products.categories.bedroom'),
    bucatarie: t('products.categories.dining'),
    birou: t('products.categories.office'),
    hol: t('products.categories.hall'),
    baie: t('products.categories.bathroom'),
    copii: t('products.categories.kids'),
    gradina: t('products.categories.garden'),
  }), [t]);

  const getCategoryLabel = (category: string) => categoryLabelMap[category as keyof typeof categoryLabelMap] || category;
  const getProductName = (product: Product) => {
    if (language === 'ro') return product.name;
    return product.translations?.[language as 'en' | 'ru']?.name?.trim() || product.name;
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).sort();
    return cats;
  }, [products]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ startX: 0, startY: 0, objX: 0, objY: 0 });
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [handleStart, setHandleStart] = useState({
    startX: 0,
    startY: 0,
    objX: 0,
    objY: 0,
    objScale: 1,
    objRot: 0,
    startAngle: 0
  });
  const [showHelp, setShowHelp] = useState(true);
  const drawerDragRef = useRef({ startY: 0, dragging: false, dragged: false });
  
  // Color selector modal state
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [selectedProductForColor, setSelectedProductForColor] = useState<Product | null>(null);
  
  // Touch gesture state
  const [initialTouch, setInitialTouch] = useState<{ scale: number; rotation: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        getProductName(p).toLowerCase().includes(term) ||
        getCategoryLabel(p.category).toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products, language, categoryLabelMap]);

  // Start camera only when requested
  useEffect(() => {
    if (showCamera && !isEditMode) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, facingMode]);

  // Render canvas when objects change or when entering edit mode
  useEffect(() => {
    if (isEditMode && backgroundImage) {
      console.log('🎨 Rendering canvas - isEditMode:', isEditMode, 'backgroundImage:', !!backgroundImage);
      renderCanvas();
    }
  }, [objects, selectedId, isEditMode, backgroundImage]);

  const selectedObject = useMemo(
    () => (selectedId !== null ? objects.find(obj => obj.id === selectedId) || null : null),
    [objects, selectedId]
  );

  const loadProducts = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/products`);
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      const normalized = data.map((product: any) => ({
        ...product,
        id: Number(product.id)
      }));
      setProducts(normalized);
      setFilteredProducts(normalized);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.isSecureContext) {
        setLoading(false);
        setError('Camera funcționează doar pe HTTPS sau localhost.');
        return;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError) {
        console.warn('Camera constraints fallback:', firstError);
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.muted = true;
        // Safari iOS needs explicit play call
        try {
          await video.play();
        } catch (playError) {
          console.error('Video play error:', playError);
        }
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Acces cameră refuzat. Permite accesul pentru a continua.');
      } else if (err.name === 'NotFoundError') {
        setError('Nu s-a găsit nicio cameră pe dispozitiv.');
      } else {
        setError('Eroare la inițializarea camerei. Încearcă să încarci o imagine.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📸 File selected:', file.name, file.type);
    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('📖 File read complete');
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        console.error('❌ Missing data URL');
        setLoading(false);
        setError('Nu s-a putut încărca imaginea.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        console.log('🖼️ Image loaded:', img.width, 'x', img.height);
        backgroundImageRef.current = img;
        setBackgroundImage(dataUrl);
        setLoading(false);
        console.log('🎬 Entering edit mode...');
        enterEditMode();
      };
      img.onerror = (err) => {
        console.error('❌ Failed to load image:', err);
        setLoading(false);
        setError('Nu s-a putut încărca imaginea. Încearcă alt fișier.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      console.error('❌ Failed to read file');
      setLoading(false);
      setError('Nu s-a putut citi fișierul.');
    };
    reader.readAsDataURL(file);
  };

  const enterEditMode = () => {
    console.log('🎬 Enter edit mode called');
    setIsEditMode(true);
    setDrawerOpen(true);
    setShowHelp(false);
    setError(null);
    setLoading(false);
    console.log('✅ Edit mode state updated');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    // Force canvas render after state update
    setTimeout(() => {
      console.log('🎨 Forcing canvas render...');
      renderCanvas();
    }, 100);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setObjects([]);
    setSelectedId(null);
    setBackgroundImage(null);
    backgroundImageRef.current = null;
    setDrawerOpen(false);
    startCamera();
  };

  const addProductToCanvas = (product: Product, colorVariantIndex?: number) => {
    if (!isEditMode || !canvasRef.current) return;

    console.log('Adding product to canvas:', product.name, colorVariantIndex);

    const hasColorVariants = product.colorVariants && product.colorVariants.length > 0;
    const images = hasColorVariants && colorVariantIndex !== undefined
      ? product.colorVariants![colorVariantIndex].images
      : product.images;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current!;
      const maxSize = Math.min(canvas.width, canvas.height) * 0.3;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);

      const newObj: CanvasObject = {
        id: Date.now(),
        image: img,
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: img.width * scale,
        height: img.height * scale,
        rotation: 0,
        scale: 1,
        product
      };

      console.log('Product object created:', newObj);
      setObjects(prev => {
        const updated = [...prev, newObj];
        console.log('Updated objects:', updated.length);
        return updated;
      });
      setSelectedId(newObj.id);
      setDrawerOpen(false); // Close drawer after adding product
    };
    img.onerror = (err) => {
      console.error('Failed to load product image:', images[0], err);
    };
    img.src = images[0];
  };

  const handleProductClick = (product: Product) => {
    const hasColorVariants = product.colorVariants && product.colorVariants.length > 0;
    
    if (hasColorVariants) {
      setSelectedProductForColor(product);
      setShowColorSelector(true);
    } else {
      addProductToCanvas(product);
    }
  };

  const handleColorSelect = (colorIndex: number) => {
    if (selectedProductForColor) {
      addProductToCanvas(selectedProductForColor, colorIndex);
    }
    setShowColorSelector(false);
    setSelectedProductForColor(null);
  };

  const renderCanvas = () => {
    if (!canvasRef.current || !backgroundImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgroundImageRef.current) {
      if (canvas.width !== backgroundImageRef.current.width || canvas.height !== backgroundImageRef.current.height) {
        canvas.width = backgroundImageRef.current.width;
        canvas.height = backgroundImageRef.current.height;
      }
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback: load background image
      const bgImg = new Image();
      bgImg.onload = () => {
        backgroundImageRef.current = bgImg;
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        drawObjects(ctx);
      };
      bgImg.src = backgroundImage;
      return; // Exit and wait for image to load
    }

    // Draw all objects
    drawObjects(ctx);
  };

  const drawObjects = (ctx: CanvasRenderingContext2D) => {
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate((obj.rotation * Math.PI) / 180);
      ctx.scale(obj.scale, obj.scale);

      ctx.drawImage(obj.image, -obj.width / 2, -obj.height / 2, obj.width, obj.height);

      if (obj.id === selectedId) {
        const hw = obj.width / 2;
        const hh = obj.height / 2;
        const handleSize = 12 / obj.scale;

        // Bounding box
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3 / obj.scale;
        ctx.strokeRect(-hw, -hh, obj.width, obj.height);

        // Corner resize handles (white squares)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2 / obj.scale;
        const corners = [
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: -hw, y: hh }
        ];
        corners.forEach(corner => {
          ctx.beginPath();
          ctx.rect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });

        // Edge rotation handles (green circles)
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#ffffff';
        const edges = [
          { x: 0, y: -hh },
          { x: hw, y: 0 },
          { x: 0, y: hh },
          { x: -hw, y: 0 }
        ];
        edges.forEach(edge => {
          ctx.beginPath();
          ctx.arc(edge.x, edge.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      ctx.restore();
    });
  };

  const getHandleAtPosition = (x: number, y: number, obj: CanvasObject): HandleType | null => {
    const dx = x - obj.x;
    const dy = y - obj.y;

    const cos = Math.cos((-obj.rotation * Math.PI) / 180);
    const sin = Math.sin((-obj.rotation * Math.PI) / 180);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const hw = (obj.width * obj.scale) / 2;
    const hh = (obj.height * obj.scale) / 2;
    const handleSize = 20;

    const handles = [
      { x: -hw, y: -hh, handle: 'resize-tl' as HandleType },
      { x: hw, y: -hh, handle: 'resize-tr' as HandleType },
      { x: hw, y: hh, handle: 'resize-br' as HandleType },
      { x: -hw, y: hh, handle: 'resize-bl' as HandleType },
      { x: 0, y: -hh, handle: 'rotate-t' as HandleType },
      { x: hw, y: 0, handle: 'rotate-r' as HandleType },
      { x: 0, y: hh, handle: 'rotate-b' as HandleType },
      { x: -hw, y: 0, handle: 'rotate-l' as HandleType }
    ];

    for (const h of handles) {
      if (Math.abs(localX - h.x) <= handleSize && Math.abs(localY - h.y) <= handleSize) {
        return h.handle;
      }
    }

    return null;
  };

  const getObjectAtPosition = (x: number, y: number): CanvasObject | null => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const dx = x - obj.x;
      const dy = y - obj.y;

      const cos = Math.cos((-obj.rotation * Math.PI) / 180);
      const sin = Math.sin((-obj.rotation * Math.PI) / 180);
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;

      const halfW = (obj.width * obj.scale) / 2;
      const halfH = (obj.height * obj.scale) / 2;
      const padding = 8;

      if (Math.abs(rotatedX) <= halfW + padding && Math.abs(rotatedY) <= halfH + padding) {
        return obj;
      }
    }
    return null;
  };

  const dragSpeed = 1.1;

  const handleDrawerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('input')) return;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;
    drawerDragRef.current = { startY: e.clientY, dragging: true, dragged: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDrawerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawerDragRef.current.dragging) return;
    const delta = e.clientY - drawerDragRef.current.startY;
    if (Math.abs(delta) < 24) return;
    drawerDragRef.current.dragged = true;
    if (delta < 0) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
    drawerDragRef.current.dragging = false;
  };

  const handleDrawerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('input')) return;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;
    if (!drawerDragRef.current.dragged) {
      setDrawerOpen(prev => !prev);
    }
    drawerDragRef.current.dragging = false;
  };

  const bringToFront = (id: number) => {
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (selectedObject) {
      const handle = getHandleAtPosition(x, y, selectedObject);
      if (handle) {
        setActiveHandle(handle);
        setIsDragging(false);
        const startAngle = (Math.atan2(y - selectedObject.y, x - selectedObject.x) * 180) / Math.PI;
        setHandleStart({
          startX: x,
          startY: y,
          objX: selectedObject.x,
          objY: selectedObject.y,
          objScale: selectedObject.scale,
          objRot: selectedObject.rotation,
          startAngle
        });
        return;
      }
    }

    const obj = getObjectAtPosition(x, y);
    if (obj) {
      setSelectedId(obj.id);
      bringToFront(obj.id);
      setIsDragging(true);
      setActiveHandle(null);
      setDragStart({ startX: x, startY: y, objX: obj.x, objY: obj.y });
    } else {
      setSelectedId(null);
      setActiveHandle(null);
      setIsDragging(false);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedObject) return;
    if (!isDragging && !activeHandle) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeHandle) {
      if (activeHandle.startsWith('rotate')) {
        const currentAngle = (Math.atan2(y - selectedObject.y, x - selectedObject.x) * 180) / Math.PI;
        const delta = currentAngle - handleStart.startAngle;
        const newRotation = handleStart.objRot + delta;

        setObjects(prev =>
          prev.map(obj =>
            obj.id === selectedId
              ? { ...obj, rotation: newRotation }
              : obj
          )
        );
      } else if (activeHandle.startsWith('resize')) {
        const startDist = Math.hypot(handleStart.startX - handleStart.objX, handleStart.startY - handleStart.objY);
        const currentDist = Math.hypot(x - selectedObject.x, y - selectedObject.y);
        const scaleFactor = currentDist / startDist;
        const newScale = Math.max(0.1, Math.min(5, handleStart.objScale * scaleFactor));

        setObjects(prev =>
          prev.map(obj =>
            obj.id === selectedId
              ? { ...obj, scale: newScale }
              : obj
          )
        );
      }
    } else if (isDragging) {
      const dx = (x - dragStart.startX) * dragSpeed;
      const dy = (y - dragStart.startY) * dragSpeed;

      setObjects(prev =>
        prev.map(obj =>
          obj.id === selectedId
            ? { ...obj, x: dragStart.objX + dx, y: dragStart.objY + dy }
            : obj
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  const deleteSelected = () => {
    if (selectedId === null) return;
    setObjects(prev => prev.filter(obj => obj.id !== selectedId));
    setSelectedId(null);
  };

  const exportImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `luxmobila-tryroom-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    if (e.touches.length === 1) {
      const x = (e.touches[0].clientX - rect.left) * scaleX;
      const y = (e.touches[0].clientY - rect.top) * scaleY;

      if (selectedObject) {
        const handle = getHandleAtPosition(x, y, selectedObject);
        if (handle) {
          setActiveHandle(handle);
          setIsDragging(false);
          const startAngle = (Math.atan2(y - selectedObject.y, x - selectedObject.x) * 180) / Math.PI;
          setHandleStart({
            startX: x,
            startY: y,
            objX: selectedObject.x,
            objY: selectedObject.y,
            objScale: selectedObject.scale,
            objRot: selectedObject.rotation,
            startAngle
          });
          return;
        }
      }

      const obj = getObjectAtPosition(x, y);
      if (obj) {
        setSelectedId(obj.id);
        bringToFront(obj.id);
        setIsDragging(true);
        setActiveHandle(null);
        setDragStart({ startX: x, startY: y, objX: obj.x, objY: obj.y });
      } else {
        setSelectedId(null);
        setActiveHandle(null);
        setIsDragging(false);
      }
    } else if (e.touches.length === 2 && selectedObject) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      setInitialDistance(Math.sqrt(dx * dx + dy * dy));
      setInitialAngle((Math.atan2(dy, dx) * 180) / Math.PI);
      setInitialTouch({
        scale: selectedObject.scale,
        rotation: selectedObject.rotation
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    if (e.touches.length === 1 && selectedObject) {
      const x = (e.touches[0].clientX - rect.left) * scaleX;
      const y = (e.touches[0].clientY - rect.top) * scaleY;

      if (activeHandle) {
        if (activeHandle.startsWith('rotate')) {
          const currentAngle = (Math.atan2(y - selectedObject.y, x - selectedObject.x) * 180) / Math.PI;
          const delta = currentAngle - handleStart.startAngle;
          const newRotation = handleStart.objRot + delta;

          setObjects(prev =>
            prev.map(obj =>
              obj.id === selectedId
                ? { ...obj, rotation: newRotation }
                : obj
            )
          );
        } else if (activeHandle.startsWith('resize')) {
          const startDist = Math.hypot(handleStart.startX - handleStart.objX, handleStart.startY - handleStart.objY);
          const currentDist = Math.hypot(x - selectedObject.x, y - selectedObject.y);
          const scaleFactor = currentDist / startDist;
          const newScale = Math.max(0.1, Math.min(5, handleStart.objScale * scaleFactor));

          setObjects(prev =>
            prev.map(obj =>
              obj.id === selectedId
                ? { ...obj, scale: newScale }
                : obj
            )
          );
        }
      } else if (isDragging) {
        const dx = (x - dragStart.startX) * dragSpeed;
        const dy = (y - dragStart.startY) * dragSpeed;

        setObjects(prev =>
          prev.map(obj =>
            obj.id === selectedId
              ? { ...obj, x: dragStart.objX + dx, y: dragStart.objY + dy }
              : obj
          )
        );
      }
    } else if (e.touches.length === 2 && selectedObject && initialTouch) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Scale
      const scaleFactor = distance / initialDistance;
      const newScale = Math.max(0.1, Math.min(5, initialTouch.scale * scaleFactor));

      // Rotate
      const rotationDelta = angle - initialAngle;
      const newRotation = initialTouch.rotation + rotationDelta;

      setObjects(prev =>
        prev.map(obj =>
          obj.id === selectedId
            ? { ...obj, scale: newScale, rotation: newRotation }
            : obj
        )
      );
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      setInitialTouch(null);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
      setActiveHandle(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1f1f1b] via-[#232321] to-[#1a1a18] flex flex-col">
      {/* Simple Header Bar */}
      <div className="bg-dark-900/40 backdrop-blur-md border-b border-white/5 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            <span className="text-sm font-medium">{t('tryRoomPage.back')}</span>
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-white/90">🏠 {t('tryRoomPage.title')}</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Camera/Canvas Area */}
        <div className="flex-1 bg-gradient-to-br from-[#2b2b27] via-[#2f2f2a] to-[#262622] relative flex items-center justify-center p-4 sm:p-6">
          {!isEditMode && !showCamera ? (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-white mb-6">{t('tryRoomPage.chooseMode')}</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex flex-col items-center gap-3 px-8 py-6 btn-lux rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg"
                >
                  <Camera className="w-12 h-12 text-white" />
                  <span className="text-lg font-medium text-white">{t('tryRoomPage.useCamera')}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 px-8 py-6 btn-lux rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg"
                >
                  <Upload className="w-12 h-12 text-white" />
                  <span className="text-lg font-medium text-white">{t('tryRoomPage.uploadImage')}</span>
                </button>
              </div>
            </div>
          ) : !isEditMode ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
                style={{ display: loading || error ? 'none' : 'block' }}
              />
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-white">{t('tryRoomPage.loadingCamera')}</p>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <X className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-white mb-2">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 btn-lux rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {t('tryRoomPage.uploadAnImage')}
                    </button>
                    <button
                      onClick={() => {
                        setShowCamera(false);
                        setError(null);
                        setLoading(false);
                      }}
                      className="px-6 py-3 bg-dark-800/80 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 transition-all duration-300 border border-white/10 hover:border-white/20"
                    >
                      {t('tryRoomPage.back')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {backgroundImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full max-w-[1200px] max-h-[70vh] sm:max-h-[78vh] bg-gradient-to-br from-[#3a3a34]/70 via-[#34342f]/50 to-[#3a3a34]/70 rounded-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-3 sm:p-4 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain rounded-2xl bg-[#1d1d1a]"
                      style={{ cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 bg-dark-900/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10 shadow-lg">
                      <button
                        onClick={exitEditMode}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800/80 hover:bg-dark-700 rounded-xl transition-all duration-300 text-white border border-white/10 hover:border-white/20"
                      >
                        <RotateCw className="w-5 h-5" />
                        <span>{t('tryRoomPage.redo')}</span>
                      </button>

                      <button
                        onClick={deleteSelected}
                        disabled={selectedId === null}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white border border-red-500/30 hover:border-red-500/50"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>{t('tryRoomPage.delete')}</span>
                      </button>

                      <button
                        onClick={exportImage}
                        className="flex items-center gap-2 px-5 py-2 btn-lux rounded-xl transition-all duration-300 font-medium shadow-lg"
                      >
                        <Download className="w-5 h-5" />
                        <span>{t('tryRoomPage.export')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-white text-center">
                  <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>{t('tryRoomPage.preparingImage')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Products Drawer */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: drawerOpen ? 0 : 'calc(100% - 80px)' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-dark-900 via-dark-900 to-[#1b1b18] rounded-t-3xl shadow-2xl max-h-[70vh] md:max-h-[80vh] flex flex-col z-50"
            >
              {/* Clickable Header Area */}
              <div
                className="cursor-pointer hover:bg-white/5 transition-colors duration-200 active:bg-white/10"
                onClick={() => setDrawerOpen(!drawerOpen)}
                onPointerDown={handleDrawerPointerDown}
                onPointerMove={handleDrawerPointerMove}
                onPointerUp={handleDrawerPointerUp}
                onPointerCancel={handleDrawerPointerUp}
              >
                <div className="w-12 h-1 bg-white/40 rounded-full mx-auto my-3" />
                
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-white">{t('tryRoomPage.chooseProduct')}</h2>
                    {!drawerOpen && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-primary-400 text-sm"
                      >
                        {t('tryRoomPage.dragUp')}
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('tryRoomPage.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Category Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {t('tryRoomPage.allCategories')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        selectedCategory === cat
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ touchAction: 'pan-y' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.inStock === false;
                    return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProductClick(product)}
                      className={`bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl p-1.5 sm:p-2 md:p-3 cursor-pointer hover:border-primary-500 border border-white/10 transition-all duration-300 group shadow-md hover:shadow-lg hover:shadow-primary-500/20 ${isOutOfStock ? 'opacity-85' : ''}`}
                    >
                      <div className="relative overflow-hidden rounded-md mb-1.5 sm:mb-2 bg-white/5 group-hover:bg-white/10 transition-colors">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className={`w-full aspect-square object-contain ${isOutOfStock ? 'grayscale contrast-75 opacity-70' : ''}`}
                          loading="lazy"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-[10px] sm:text-[11px] md:text-xs font-semibold text-white/90 tracking-wide">
                            {t('tryRoomPage.outOfStock')}
                          </div>
                        )}
                      </div>
                      <h3 className="text-white text-[10px] sm:text-[11px] md:text-xs font-medium mb-1 truncate">{getProductName(product)}</h3>
                    </motion.div>
                    );
                  })}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">{t('tryRoomPage.noProducts')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Help Button - Fixed Bottom Left */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 btn-lux rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white/20"
        aria-label={t('tryRoomPage.helpLabel')}
      >
        <HelpCircle className="w-7 h-7 text-white" />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 rounded-2xl max-w-md w-full p-6 border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{t('tryRoomPage.helpTitle')}</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('tryRoomPage.helpStep1Title')}</h4>
                    <p className="text-gray-400 text-sm">{t('tryRoomPage.helpStep1Desc')}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('tryRoomPage.helpStep2Title')}</h4>
                    <p className="text-gray-400 text-sm">{t('tryRoomPage.helpStep2Desc')}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('tryRoomPage.helpStep3Title')}</h4>
                    <p className="text-gray-400 text-sm">
                      <strong className="text-white">{t('tryRoomPage.helpStep3DescDesktop')}</strong> {t('tryRoomPage.helpStep3DescDesktopDetails')}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      <strong className="text-white">{t('tryRoomPage.helpStep3DescMobile')}</strong> {t('tryRoomPage.helpStep3DescMobileDetails')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    4
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('tryRoomPage.helpStep4Title')}</h4>
                    <p className="text-gray-400 text-sm">{t('tryRoomPage.helpStep4Desc')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Selector Modal */}
      <AnimatePresence>
        {showColorSelector && selectedProductForColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowColorSelector(false);
              setSelectedProductForColor(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 rounded-2xl max-w-md w-full p-6 border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{t('tryRoomPage.colorSelectorTitle')}</h3>
                <button
                  onClick={() => {
                    setShowColorSelector(false);
                    setSelectedProductForColor(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">{getProductName(selectedProductForColor)}</h4>
                <p className="text-gray-400 text-sm">{t('tryRoomPage.colorSelectorSubtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {selectedProductForColor.colorVariants!.map((variant, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleColorSelect(index)}
                    disabled={!variant.inStock}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      variant.inStock
                        ? 'border-white/20 hover:border-primary-500 bg-dark-800/50'
                        : 'border-white/10 bg-dark-900/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: variant.hexCode }}
                      />
                      <div className="text-left flex-1">
                        <p className="text-white font-medium text-sm">{variant.name}</p>
                        {!variant.inStock && (
                          <p className="text-red-400 text-xs">{t('tryRoomPage.outOfStock')}</p>
                        )}
                      </div>
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={variant.images[0]}
                        alt={`${getProductName(selectedProductForColor)} - ${variant.name}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default TryInMyRoomPage;
