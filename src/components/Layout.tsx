// src/components/Layout.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu as MenuIcon,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCircle,
  Truck,
  Coins,
  CreditCard,
  DollarSign,
  Tags,
  User,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout } from '../services/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { clearSession } from '../utils/storage';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, setUser } = useUser();

  const menuItems = [
    { icon: LayoutDashboard, label: t('menu.overview'), path: '/dashboard' },
    { icon: Package, label: t('menu.products'), path: '/products' },
    { icon: ShoppingCart, label: t('menu.orders'), path: '/orders' },
    { icon: Users, label: t('menu.partners'), path: '/partners' },
    { icon: UserCircle, label: t('menu.employees'), path: '/employees' },
    { icon: Truck, label: t('menu.supplierInvoices'), path: '/supplier-invoices' },
    { icon: Coins, label: t('menu.cashReceipts'), path: '/cash-receipts' },
    { icon: CreditCard, label: t('menu.transferReceipts'), path: '/transfer-receipts' },
    { icon: DollarSign, label: t('menu.currency'), path: '/currency' },
    { icon: User, label: t('menu.profile'), path: '/profile' }
  ];

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.label || '';
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await logout(user);
      }
      setUser(null);
      clearSession();
      toast.success(t('message.logoutSuccess'));
      navigate('/');
    } catch (error) {
      console.error('Logout error in Layout:', error);
      setUser(null);
      clearSession();
      toast.error(t('message.logoutFailed'));
    }
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5">
          <div className="flex items-center justify-between px-4 mb-5">
            <h1 className="text-xl font-bold text-gray-800">Baby Shop</h1>
            <LanguageSwitcher />
          </div>
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors duration-150 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    location.pathname === item.path
                      ? 'text-blue-700'
                      : 'text-gray-500 group-hover:text-gray-900'
                  }`} />
                  {item.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-900 w-full mt-4"
              >
                <LogOut className="mr-3 h-5 w-5" />
                {t('menu.logout')}
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">{getCurrentPageTitle()}</h1>
          <div className="w-6" />
        </div>

        <div 
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMenuOpen(false)} />
          <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleMenuItemClick(item.path)}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full transition-colors duration-150 ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-4 h-5 w-5 ${
                      location.pathname === item.path
                        ? 'text-blue-700'
                        : 'text-gray-500 group-hover:text-gray-900'
                    }`} />
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-900 w-full mt-4"
                >
                  <LogOut className="mr-4 h-5 w-5" />
                  {t('menu.logout')}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-16 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}