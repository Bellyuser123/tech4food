import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Input, Textarea } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { useToast } from '../components/common/Toast.js';
import { DEMO_CCP_LOGS, DEMO_RESTAURANT } from '../data/mockData.js';
import { MenuItem, StructuredAllergen, TableQrRecord } from '../types/index.js';
import { ApiService } from '../services/api.js';
import {
  Thermometer,
  UserCheck,
  UtensilsCrossed,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  AlertTriangle,
  Edit3,
  QrCode,
  Printer,
  RotateCcw,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ccp' | 'menu_manager' | 'tables_qr' | 'incidents' | 'audit'>('menu_manager');

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);

  // Table QR Stations state
  const [tableQrs, setTableQrs] = useState<TableQrRecord[]>([]);
  const [isGenerateQrModalOpen, setIsGenerateQrModalOpen] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('Table 14 - Terrace');
  const [tentCardToPrint, setTentCardToPrint] = useState<TableQrRecord | null>(null);

  // New Dish Modal state
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Form states for New Dish
  const [newDishName, setNewDishName] = useState<string>('');
  const [newDishDescription, setNewDishDescription] = useState<string>('');
  const [newDishPrice, setNewDishPrice] = useState<string>('22.00');
  const [newDishCategory, setNewDishCategory] = useState<string>('cat-2');
  const [newDishImageUrl, setNewDishImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  );
  const [newDishIngredients, setNewDishIngredients] = useState<string>('Semolina flour, Free-range eggs, Sea salt');
  const [selectedAllergens, setSelectedAllergens] = useState<Record<string, 'contains' | 'may_contain' | 'free_from' | 'not_provided'>>({
    gluten: 'contains',
    eggs: 'contains',
    dairy: 'free_from',
    peanuts: 'free_from',
    celery: 'not_provided',
  });

  // Profile Form state
  const [profileName, setProfileName] = useState<string>(DEMO_RESTAURANT.name);
  const [profileDescription, setProfileDescription] = useState<string>(DEMO_RESTAURANT.description);
  const [profileAddress, setProfileAddress] = useState<string>(DEMO_RESTAURANT.address);
  const [profilePhone, setProfilePhone] = useState<string>(DEMO_RESTAURANT.phone);
  const [profileHours, setProfileHours] = useState<string>(DEMO_RESTAURANT.openingHours || '');

  // Demo token for Elena Rossi (Manager)
  const [managerToken] = useState<string>('demo-token');

  // Load menu items from API
  const loadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const data = await ApiService.getPublicMenu('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      if (data && data.items) {
        const mapped: MenuItem[] = data.items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          category: i.category_id === 'cat-2' ? 'Handmade Pasta' : i.category_id === 'cat-3' ? 'Wood-Fired Mains' : i.category_id === 'cat-4' ? 'Antipasti' : 'Chef Specials',
          imageUrl: i.image_url,
          dietaryTags: i.dietary_tags,
          isAvailable: i.is_available,
          prepTemperature: i.prep_temperature,
          ingredients: i.ingredients,
          allergens: i.allergens.filter((a) => a.status === 'contains').map((a) => a.allergen_code.toUpperCase()),
          structuredAllergens: i.allergens,
          hasUnverifiedAllergens: i.has_unverified_allergens,
        }));
        setMenuItems(mapped);
      }
    } catch (err: unknown) {
      console.warn('Could not load live menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const loadTableQrs = async () => {
    try {
      const qrs = await ApiService.listTableQrCodes(
        'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        managerToken
      );
      if (qrs && qrs.length > 0) {
        setTableQrs(qrs);
      }
    } catch (err: unknown) {
      console.warn('Could not load table QR codes:', err);
    }
  };

  useEffect(() => {
    loadMenu();
    loadTableQrs();
  }, []);

  const handleGenerateTableQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      showToast({ type: 'error', title: 'Table number required', description: 'Please enter table identifier' });
      return;
    }

    try {
      const newQr = await ApiService.generateTableQrCode(
        'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        managerToken,
        newTableNumber.trim()
      );
      setTableQrs((prev) => [newQr, ...prev]);
      setIsGenerateQrModalOpen(false);
      setTentCardToPrint(newQr);
      showToast({
        type: 'success',
        title: 'Table QR Station Created',
        description: `${newTableNumber} QR generated with high-resolution visual assets.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Could not generate QR code',
      });
    }
  };

  const handleRevokeTableQr = async (tokenId: string, tableNumber: string) => {
    try {
      await ApiService.revokeQrCode('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', managerToken, tokenId);
      setTableQrs((prev) =>
        prev.map((t) => (t.id === tokenId ? { ...t, isRevoked: true } : t))
      );
      showToast({
        type: 'warning',
        title: 'Table QR Revoked',
        description: `${tableNumber} QR code has been marked revoked. Any diner scanning it will be safely blocked.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Revocation failed',
        description: err instanceof Error ? err.message : 'Could not revoke QR code',
      });
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i))
    );

    try {
      await ApiService.toggleMenuItemAvailability(
        'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        managerToken,
        item.id,
        newStatus
      );
      showToast({
        type: 'success',
        title: 'Availability updated',
        description: `${item.name} is now marked ${newStatus ? 'Available' : 'Unavailable'}.`,
      });
    } catch (err: unknown) {
      // Revert on failure
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !newStatus } : i))
      );
      showToast({
        type: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update availability',
      });
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await ApiService.deleteMenuItem('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', managerToken, itemId);
      showToast({
        type: 'success',
        title: 'Item removed',
        description: `${name} has been removed from the menu.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Deletion failed',
        description: err instanceof Error ? err.message : 'Could not delete item',
      });
      loadMenu();
    }
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) {
      showToast({ type: 'error', title: 'Name required', description: 'Please enter dish name' });
      return;
    }

    const structuredAllergensPayload: StructuredAllergen[] = Object.entries(selectedAllergens).map(
      ([code, status]) => ({ allergen_code: code, status })
    );

    const payload = {
      categoryId: newDishCategory,
      name: newDishName.trim(),
      description: newDishDescription.trim(),
      price: parseFloat(newDishPrice) || 15.0,
      imageUrl: newDishImageUrl,
      ingredients: newDishIngredients.split(',').map((s) => s.trim()).filter(Boolean),
      allergens: structuredAllergensPayload,
      dietaryTags: ['Vegetarian'],
      isAvailable: true,
    };

    try {
      await ApiService.createMenuItem('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', managerToken, payload);
      showToast({
        type: 'success',
        title: 'Dish created successfully',
        description: `${newDishName} has been added to the menu and persisted to the server.`,
      });
      setIsAddDishModalOpen(false);
      setNewDishName('');
      setNewDishDescription('');
      loadMenu();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Creation failed',
        description: err instanceof Error ? err.message : 'Could not create dish',
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateRestaurantProfile('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', managerToken, {
        name: profileName,
        description: profileDescription,
        address: profileAddress,
        phone: profilePhone,
        openingHours: profileHours,
      });
      showToast({
        type: 'success',
        title: 'Profile updated',
        description: 'Restaurant profile changes have been persisted.',
      });
      setIsProfileModalOpen(false);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Profile update failed',
        description: err instanceof Error ? err.message : 'Could not update profile',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await ApiService.uploadImage(managerToken, base64, file.name);
          setNewDishImageUrl(res.url);
          showToast({
            type: 'success',
            title: 'Image uploaded',
            description: `File stored at ${res.url}`,
          });
        } catch (err: unknown) {
          showToast({
            type: 'error',
            title: 'Upload failed',
            description: err instanceof Error ? err.message : 'Could not upload image',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-300">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
              Operational Management Dashboard
            </h1>
            <Badge variant="demo" size="sm">
              Manager Control Center
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {profileName} &bull; Branch 01 &bull; Active Shift: Dinner Service
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsProfileModalOpen(true)}>
            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
          </Button>
          <Badge variant="safety" size="md">
            Elena Rossi (Manager)
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-cream-200 p-1 rounded-2xl border border-cream-300 max-w-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('menu_manager')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'menu_manager' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
          }`}
        >
          Menu Management ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('tables_qr')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tables_qr' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
          }`}
        >
          Tables &amp; QR Codes ({tableQrs.length})
        </button>
        <button
          onClick={() => setActiveTab('ccp')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ccp' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
          }`}
        >
          CCP Temperatures
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'incidents' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
          }`}
        >
          Corrective Actions (1)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
          }`}
        >
          Immutable Audit
        </button>
      </div>

      {/* Tab Content: Menu Management */}
      {activeTab === 'menu_manager' && (
        <Card variant="default">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>A la Carte Dishes &amp; Structured Allergen Control</CardTitle>
                <CardDescription>
                  Manage live prices, toggle availability in real-time, and declare ingredients.
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddDishModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Menu Dish
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingMenu ? (
              <div className="p-8 text-center text-xs text-stone-500">Loading menu records...</div>
            ) : menuItems.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-stone-400">
                <UtensilsCrossed className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-stone-700">No dishes on the menu yet</p>
                <p className="text-xs">Click "Add Menu Dish" above to create your first recipe.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 overflow-x-auto">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-cream-50/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900 truncate">{item.name}</h4>
                          <span className="text-xs font-mono font-bold text-burgundy-700">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate max-w-md">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.hasUnverifiedAllergens ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Allergen Info Pending
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              ✓ Allergens Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          item.isAvailable !== false
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                        title="Toggle live ordering availability"
                      >
                        {item.isAvailable !== false ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-stone-400" />
                            <span>Unavailable</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Tables & QR Stations */}
      {activeTab === 'tables_qr' && (
        <Card variant="default">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Table QR Code Stations</CardTitle>
                <CardDescription>
                  Generate, print, and revoke table stand QR codes. Diners scanning these codes access the authenticated menu, ingredients, and live CCP logs.
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsGenerateQrModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Generate Table QR
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tableQrs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <QrCode className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-sm font-semibold text-stone-700">No Table QR Codes Generated Yet</p>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Click 'Generate Table QR' to create printable station QR codes for your dining room.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsGenerateQrModalOpen(true)}
                >
                  Generate First Table QR
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tableQrs.map((qr) => (
                  <div
                    key={qr.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {qr.qrDataUrl ? (
                        <img
                          src={qr.qrDataUrl}
                          alt={qr.tableNumber}
                          className="w-16 h-16 rounded-xl border border-stone-200 bg-white p-1 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-burgundy-50 border border-burgundy-200 flex items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-burgundy-600" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-stone-900">
                            {qr.tableNumber}
                          </h3>
                          {qr.isRevoked ? (
                            <Badge variant="danger" size="sm">
                              Revoked
                            </Badge>
                          ) : (
                            <Badge variant="safety" size="sm">
                              Active Station
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 font-mono">
                          Token Hash: {qr.tokenHash?.slice(0, 16)}...
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Created: {new Date(qr.createdAt).toLocaleDateString()} &bull; Stable Deep Link
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTentCardToPrint(qr)}
                        className="flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Tent Card</span>
                      </Button>

                      {!qr.isRevoked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeTableQr(qr.id, qr.tableNumber)}
                          className="flex items-center gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revoke QR</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: CCP Temperatures */}
      {activeTab === 'ccp' && (
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Critical Control Point (CCP) Live Log</CardTitle>
                <CardDescription>
                  Cold chains and hot holding logs for {profileName} &bull; Kitchen Line
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-100 overflow-x-auto">
              {DEMO_CCP_LOGS.map((log) => (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-cream-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        log.status === 'pass'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{log.equipment}</h4>
                      <p className="text-xs text-stone-500">
                        Target Range: <span className="font-mono">{log.target}</span> &bull; Logged by {log.loggedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-mono font-bold text-base text-stone-900">
                        {log.currentTemp}
                      </span>
                      <p className="text-[10px] text-stone-400">{log.timestamp}</p>
                    </div>
                    <Badge variant={log.status === 'pass' ? 'safety' : 'warning'} size="sm">
                      {log.status === 'pass' ? 'IN RANGE' : 'CHECK SENSOR'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Corrective Actions */}
      {activeTab === 'incidents' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Corrective Actions &amp; Dual-Control Verification</CardTitle>
            <CardDescription>
              Rule: The supervisor signing off on a corrective action cannot be the staff member who performed it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-900">ACT-2026-081</span>
                <Badge variant="warning" size="sm">
                  Awaiting Supervisor Verification
                </Badge>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900">
                  Prep Line Cold Bar Gasket Inspection &amp; Re-calibration
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Temperature drifted to 4.6°C during peak prep. Cleaned condenser coils, replaced magnetic seal, and temperature returned to 2.4°C.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-amber-200/60 text-stone-600">
                <div>
                  <strong>Performed by:</strong> Line Cook Leo D.
                </div>
                <div>
                  <strong>Supervisor Sign-off:</strong>{' '}
                  <span className="text-amber-800 font-semibold">Pending (Requires Marco S. or Elena R.)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-stone-500 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Dual-Control Enforced Server-Side
                </div>
                <Button variant="primary" size="sm">
                  Sign Off as Elena R. (Supervisor)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Immutable Audit */}
      {activeTab === 'audit' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Immutable Audit Trail</CardTitle>
            <CardDescription>
              Tamper-evident log of all consequential state transitions, temperature alerts, and verification signatures.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-100 text-xs">
              <div className="p-4 sm:px-6 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-stone-900">MENU_ITEM_MODIFIED</p>
                  <p className="text-stone-500">Resource: item-01 &bull; Actor: elena.manager@osteriaspina.demo</p>
                  <p className="font-mono text-[11px] text-stone-400">SHA256: 7d11...4b22</p>
                </div>
                <span className="text-stone-400">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Dish Modal */}
      {isAddDishModalOpen && (
        <Modal
          isOpen={isAddDishModalOpen}
          onClose={() => setIsAddDishModalOpen(false)}
          title="Add New Culinary Dish"
          subtitle="Declare ingredients, structured allergen status, and initial price"
          size="lg"
        >
          <form onSubmit={handleCreateDish} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Dish Name"
                required
                placeholder="e.g. Handmade Ricotta Ravioli"
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
              />
              <Input
                label="Price ($ USD)"
                type="number"
                step="0.50"
                required
                value={newDishPrice}
                onChange={(e) => setNewDishPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                Menu Category
              </label>
              <select
                value={newDishCategory}
                onChange={(e) => setNewDishCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900"
              >
                <option value="cat-1">Chef Specials</option>
                <option value="cat-2">Handmade Pasta</option>
                <option value="cat-3">Wood-Fired Mains</option>
                <option value="cat-4">Antipasti</option>
                <option value="cat-5">Desserts</option>
              </select>
            </div>

            <Textarea
              label="Dish Description"
              rows={2}
              placeholder="Detailed culinary notes for guests..."
              value={newDishDescription}
              onChange={(e) => setNewDishDescription(e.target.value)}
            />

            <Input
              label="Declared Ingredients (Comma-separated)"
              placeholder="e.g. Ricotta, Spinach, Nutmeg, Egg pasta"
              value={newDishIngredients}
              onChange={(e) => setNewDishIngredients(e.target.value)}
            />

            {/* Structured Allergen Matrix with 4 States */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                Structured Allergen Declarations (4-State Matrix)
              </label>
              <p className="text-[11px] text-stone-500">
                Rule: Missing data is flagged as 'Not Provided' and is never treated as allergen-free.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Object.entries(selectedAllergens).map(([code, status]) => (
                  <div key={code} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-800 uppercase">
                      <span>{code}</span>
                      <span className="text-[10px] text-stone-400 font-normal">status</span>
                    </div>
                    <div className="flex gap-1 text-[10px]">
                      {(['contains', 'may_contain', 'free_from', 'not_provided'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedAllergens((prev) => ({ ...prev, [code]: s }))}
                          className={`flex-1 py-1 px-1 rounded-md text-center font-bold transition-all ${
                            status === s
                              ? s === 'contains'
                                ? 'bg-red-700 text-white'
                                : s === 'may_contain'
                                ? 'bg-amber-600 text-white'
                                : s === 'free_from'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-stone-700 text-white'
                              : 'bg-white border border-stone-200 text-stone-600'
                          }`}
                        >
                          {s === 'contains' ? 'Contains' : s === 'may_contain' ? 'Risk' : s === 'free_from' ? 'Free' : 'Unknown'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload selector */}
            <div className="space-y-1.5 pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                Dish Photo (Upload or Image URL)
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  value={newDishImageUrl}
                  onChange={(e) => setNewDishImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
                <label className="shrink-0 p-2.5 rounded-xl bg-cream-200 border border-cream-300 text-stone-700 hover:bg-cream-300 cursor-pointer text-xs font-semibold flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
              <Button type="button" variant="secondary" onClick={() => setIsAddDishModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save &amp; Publish Dish
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Edit Restaurant Information"
          subtitle="Maintain public contact details, trading description, and hours"
          size="md"
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Trading Name"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <Textarea
              label="Public Description"
              rows={3}
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
            />
            <Input
              label="Branch Address"
              required
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
            />
            <Input
              label="Contact Phone"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
            />
            <Input
              label="Operating Hours"
              value={profileHours}
              onChange={(e) => setProfileHours(e.target.value)}
            />

            <div className="p-3 bg-cream-100 rounded-xl border border-cream-300 text-xs text-stone-600">
              <p className="font-bold text-stone-800">Anti-Self-Verification Protection:</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Official certification status ('is_verified') cannot be altered by restaurant accounts. Only Platform Administrators may grant official inspection verification.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Profile
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Table QR Modal */}
      {isGenerateQrModalOpen && (
        <Modal
          isOpen={isGenerateQrModalOpen}
          onClose={() => setIsGenerateQrModalOpen(false)}
          title="Generate Table QR Code Station"
          size="md"
        >
          <form onSubmit={handleGenerateTableQr} className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Create a cryptographic QR code station for physical table placement. Diners will scan this to open the live menu, ingredient disclosures, and verified HACCP logs.
            </p>
            <Input
              label="Table Number or Station Name"
              required
              placeholder="e.g. Table 04, Table 12 - Patio, Booth 3"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
            />
            <div className="p-3 bg-cream-100 rounded-xl border border-cream-300 text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-800">Tamper &amp; Revocation Protection:</p>
              <p className="text-[11px] text-stone-500">
                Each table QR uses an opaque 256-bit hash. If a physical sticker is damaged or altered, you can revoke and replace it instantly from this dashboard without affecting other tables.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsGenerateQrModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Generate QR Station
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Stand Tent Card Modal */}
      {tentCardToPrint && (
        <Modal
          isOpen={!!tentCardToPrint}
          onClose={() => setTentCardToPrint(null)}
          title={`Printable Stand Tent: ${tentCardToPrint.tableNumber}`}
          size="md"
        >
          <div className="space-y-4 text-center">
            {/* Printable Preview Card matching brand design */}
            <div
              id="printable-tent-card"
              className="p-6 bg-white border-2 border-burgundy-900 rounded-3xl shadow-md max-w-xs mx-auto space-y-3"
            >
              <div className="space-y-1">
                <span className="font-display font-black text-xl text-burgundy-900 tracking-tight block">
                  PlateProof 360
                </span>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
                  Verified Food Safety &amp; Accountability
                </span>
              </div>

              {tentCardToPrint.qrDataUrl && (
                <div className="p-3 bg-cream-50 rounded-2xl border border-stone-200 inline-block shadow-inner">
                  <img
                    src={tentCardToPrint.qrDataUrl}
                    alt={tentCardToPrint.tableNumber}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-2xl text-stone-900">
                  {tentCardToPrint.tableNumber}
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  Scan with your phone camera to browse dishes, confirmed allergens &amp; real-time kitchen safety logs.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[10px] font-mono text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>Station Hash: {tentCardToPrint.tokenHash?.slice(0, 12)}...</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setTentCardToPrint(null)}>
                Close Preview
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Stand Tent</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
