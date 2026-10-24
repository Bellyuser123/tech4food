import React from 'react';
import { Logo } from './Logo.js';
import { ApiHealthBadge } from './ApiHealthBadge.js';
import {
  UtensilsCrossed,
  Store,
  AlertOctagon,
  LayoutDashboard,
  LogIn,
  QrCode,
  Receipt,
} from 'lucide-react';

export type ActivePage = 'profile' | 'menu' | 'order' | 'complaint' | 'dashboard' | 'login' | 'health';

interface NavigationProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onOpenQrScanner?: () => void;
  hasActiveOrder?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  onPageChange,
  onOpenQrScanner,
  hasActiveOrder = false,
}) => {
  const navItems = [
    { id: 'profile' as ActivePage, label: 'Restaurant', icon: Store },
    { id: 'menu' as ActivePage, label: 'Menu & Safety', icon: UtensilsCrossed },
    ...(hasActiveOrder
      ? [{ id: 'order' as ActivePage, label: 'Active Order', icon: Receipt }]
      : []),
    { id: 'complaint' as ActivePage, label: 'Report Issue', icon: AlertOctagon },
    { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'login' as ActivePage, label: 'Portal', icon: LogIn },
  ];

  return (
    <>
      {/* Top Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cream-300 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onPageChange('profile')}
            className="flex items-center text-left focus:outline-none"
          >
            <Logo size="md" showSubtitle />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-burgundy-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-cream-200/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Status Widget */}
          <div className="flex items-center gap-2.5">
            {onOpenQrScanner && (
              <button
                onClick={onOpenQrScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-700 border border-burgundy-200 transition-all shadow-sm"
                title="Scan Table or Order QR Code"
              >
                <QrCode className="w-4 h-4 text-burgundy-600" />
                <span className="hidden sm:inline">Scan QR / Test Token</span>
                <span className="sm:hidden">Scan QR</span>
              </button>
            )}
            <ApiHealthBadge />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, accessible) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-2 py-1.5 shadow-toast">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[50px] ${
                  isActive
                    ? 'text-burgundy-700 font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-burgundy-50 text-burgundy-600' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
          {onOpenQrScanner && (
            <button
              onClick={onOpenQrScanner}
              className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[50px] text-burgundy-700"
            >
              <div className="p-1 rounded-lg bg-burgundy-100 text-burgundy-700">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Scan QR</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
