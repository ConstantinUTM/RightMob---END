import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Mail,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLoginModal from './AdminLoginModal';
import Logo from './Logo';

// Helper function to get admin profile
const getAdminProfile = () => {
  const saved = localStorage.getItem('adminProfile');
  return saved ? JSON.parse(saved) : {
    username: 'Admin',
    email: 'admin@luxmobila.com',
    profileImage: 'https://ui-avatars.com/api/?name=Admin&background=8B4513&color=fff&size=200'
  };
};

const AdminLayout: React.FC = () => {
  const { isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [profile, setProfile] = useState(getAdminProfile());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Reload profile when location changes (e.g., after saving settings)
  useEffect(() => {
    setProfile(getAdminProfile());
  }, [location]);

  const menuItems = [
    {
      path: '/',
      icon: Home,
      label: 'Vezi site',
    },
    {
      path: '/admin/gallery',
      icon: Package,
      label: 'Galerie',
    },
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
    },
    {
      path: '/admin/analytics',
      icon: BarChart3,
      label: 'Vizionări',
    },
    {
      path: '/admin/messages',
      icon: Mail,
      label: 'Mesaje',
    },
    {
      path: '/admin/reviews',
      icon: MessageSquare,
      label: 'Recenzii',
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: 'Setări',
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/60 via-white to-red-50/60 p-6">
        <div className="rounded-2xl shadow-xl p-8 max-w-md w-full text-center bg-white/90 backdrop-blur border border-primary-200/50">
          <h1 className="text-2xl font-bold text-dark-950 mb-2">Panou Administrare RightMob</h1>
          <p className="text-dark-600 mb-6">Acces doar pentru administratori.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="btn-lux px-6 py-3 rounded-xl font-semibold"
            >
              Conectare Admin
            </button>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl font-semibold text-dark-600 hover:bg-primary-50 border border-primary-200/50 transition-colors"
            >
              Înapoi la site
            </Link>
          </div>
        </div>
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className="bg-white border-r border-gray-200 flex flex-col fixed h-screen z-40"
        style={{ width: isSidebarOpen ? 280 : 80 }}
      >
        {/* Logo & Toggle */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
          {isSidebarOpen ? (
            <Link to="/" className="flex items-center">
              <Logo size="sm" />
            </Link>
          ) : (
            <div className="flex justify-center w-full">
              <Link to="/">
                <Logo size="sm" />
              </Link>
            </div>
          )}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -right-3 top-8 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg ${
                  active
                    ? 'bg-neutral-700 text-white'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* Admin Profile */}
        <div className="p-3 border-t border-gray-200">
          <Link
            to="/admin/settings"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
              location.pathname === '/admin/settings' ? 'bg-gray-100' : ''
            }`}
          >
            <img
              src={profile.profileImage}
              alt={profile.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-200 flex-shrink-0"
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{profile.username}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
            )}
          </Link>
        </div>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-red-600 w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '280px' : '80px',
        }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
