import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/common/Toast.js';
import { Navigation, ActivePage } from './components/common/Navigation.js';
import { RestaurantProfilePage } from './pages/RestaurantProfilePage.js';
import { MenuPage } from './pages/MenuPage.js';
import { CustomerOrderPage } from './pages/CustomerOrderPage.js';
import { CustomerComplaintPage } from './pages/CustomerComplaintPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { QrScannerModal } from './components/common/QrScannerModal.js';
import { Logo } from './components/common/Logo.js';
import { CustomerOrderView, QrResolutionResult } from './types/index.js';
import { ApiService } from './services/api.js';
import { ShieldCheck, Database, Info } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [activePage, setActivePage] = useState<ActivePage>('profile');
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<CustomerOrderView | null>(null);
  const [selectedOrderRef, setSelectedOrderRef] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Check URL parameters on mount for ?token= or ?table=
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const tableParam = params.get('table');

      if (tableParam) {
        setActiveTable(tableParam);
        setActivePage('menu');
      }

      if (token) {
        ApiService.resolveQrToken(token)
          .then((result) => {
            handleQrResolved(result);
          })
          .catch((err) => {
            console.warn('Initial QR token resolution error:', err);
            showToast({
              type: 'error',
              title: 'QR Code Resolution',
              message: err.message || 'Scanned QR token could not be verified.',
            });
          });
      }
    } catch (e) {
      console.error('URL parameter parsing failed:', e);
    }
  }, []);

  const handleQrResolved = (result: QrResolutionResult) => {
    if (result.type === 'order' && result.order) {
      setActiveOrder(result.order);
      setSelectedOrderRef(result.order.orderReference);
      if (result.order.tableNumber) {
        setActiveTable(result.order.tableNumber);
      }
      setActivePage('order');
      showToast({
        type: 'success',
        title: 'Order Verified',
        message: `Order #${result.order.orderReference} loaded with verified kitchen temperature logs.`,
      });
    } else if (result.type === 'table') {
      setActiveTable(result.tableNumber || 'Station Active');
      setActivePage('menu');
      showToast({
        type: 'success',
        title: 'Table Station Connected',
        message: `${result.tableNumber || 'Table'} verified. Browsing authenticated menu and allergen disclosures.`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-stone-900">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navigation
        activePage={activePage}
        onPageChange={setActivePage}
        onOpenQrScanner={() => setIsQrModalOpen(true)}
        hasActiveOrder={!!activeOrder}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'profile' && (
          <RestaurantProfilePage
            onNavigateToMenu={() => setActivePage('menu')}
            onNavigateToComplaint={() => {
              setSelectedOrderRef('');
              setActivePage('complaint');
            }}
          />
        )}

        {activePage === 'menu' && (
          <MenuPage
            activeTableNumber={activeTable}
            onClearTable={() => setActiveTable(null)}
          />
        )}

        {activePage === 'order' && (
          <CustomerOrderPage
            orderData={activeOrder}
            onNavigateToMenu={() => setActivePage('menu')}
            onNavigateToComplaint={(ref) => {
              if (ref) setSelectedOrderRef(ref);
              setActivePage('complaint');
            }}
          />
        )}

        {activePage === 'complaint' && (
          <CustomerComplaintPage initialOrderReference={selectedOrderRef} />
        )}

        {activePage === 'dashboard' && <DashboardPage />}

        {activePage === 'login' && (
          <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />
        )}
      </main>

      {/* Global QR Scanner / Test Station Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onResolveSuccess={handleQrResolved}
      />

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
