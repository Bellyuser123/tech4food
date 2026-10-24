import React, { useState } from 'react';
import { ToastProvider } from './components/common/Toast.js';
import { Navigation, ActivePage } from './components/common/Navigation.js';
import { RestaurantProfilePage } from './pages/RestaurantProfilePage.js';
import { MenuPage } from './pages/MenuPage.js';
import { CustomerComplaintPage } from './pages/CustomerComplaintPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { Logo } from './components/common/Logo.js';
import { ShieldCheck, Database, Info } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('profile');

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-stone-900">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navigation activePage={activePage} onPageChange={setActivePage} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'profile' && (
          <RestaurantProfilePage
            onNavigateToMenu={() => setActivePage('menu')}
            onNavigateToComplaint={() => setActivePage('complaint')}
          />
        )}
        {activePage === 'menu' && <MenuPage />}
        {activePage === 'complaint' && <CustomerComplaintPage />}
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'login' && (
          <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />
        )}
      </main>

      {/* Global Footer */}
      <footer className="hidden md:block bg-stone-900 text-cream-200 border-t border-stone-800 py-10 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Logo size="md" variant="light" showSubtitle />
            <div className="flex items-center gap-4 text-cream-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Multi-Tenant Architecture
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-burgundy-400" />
                PostgreSQL Relational Core
              </span>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-stone-400 text-[11px]">
            <p>
              &copy; {new Date().getFullYear()} PlateProof 360 Inc. All rights reserved. Designed with mobile-first food safety integrity.
            </p>
            <p className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-stone-500" />
              Demo Environment &bull; Never represents unverified official certifications.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
