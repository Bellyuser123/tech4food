import React, { useState, useEffect } from 'react';
import { DEMO_MENU_ITEMS, MENU_CATEGORIES } from '../data/mockData.js';
import { MenuItem } from '../types/index.js';
import { ApiService } from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import {
  Thermometer,
  ShieldCheck,
  AlertCircle,
  Filter,
  Check,
  Flame,
  Info,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Dishes');
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState<string | null>(null);
  const [activeItemDetails, setActiveItemDetails] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEMO_MENU_ITEMS);
  const [cautionNotice, setCautionNotice] = useState<string>(
    'Notice: While our recipes are documented under strict food-safety protocols, cross-contact can occur in shared kitchen environments. Please communicate critical allergies directly to floor supervisors before consumption.'
  );

  useEffect(() => {
    // Attempt live fetch from REST API without authentication
    ApiService.getPublicMenu('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .then((data) => {
        if (data && data.items && data.items.length > 0) {
          if (data.allergyCautionNotice) {
            setCautionNotice(data.allergyCautionNotice);
          }
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
      })
      .catch((err) => {
        console.info('Operating in offline demo fallback mode:', err.message);
      });
  }, []);

  const allergensList = ['Gluten', 'Dairy', 'Eggs', 'Celery', 'Sulphites', 'Fish', 'Molluscs', 'Crustaceans'];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All Dishes' || item.category === selectedCategory;
    const matchesAllergen = selectedAllergenFilter
      ? !item.allergens.some((a) => a.toLowerCase() === selectedAllergenFilter.toLowerCase())
      : true;
    return matchesCategory && matchesAllergen;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Customer-Facing Allergy Caution Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-1.5">
            Customer Food Allergy Caution
          </p>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            {cautionNotice}
          </p>
        </div>
      </div>

      {/* Header and Safety Guarantee Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-300">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
              A la Carte Menu
            </h1>
            <Badge variant="safety" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Structured Allergen Transparency
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse kitchen preparations with full ingredient disclosures and real-time allergen states.
          </p>
        </div>

        <Badge variant="demo" size="md">
          Public QR Menu Session
        </Badge>
      </div>

      {/* Category Pills (Horizontal scrolling for mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {MENU_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-burgundy-600 text-white shadow-sm ring-2 ring-burgundy-600/30'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-burgundy-200 hover:bg-cream-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Allergen Sensitivity Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-burgundy-600" />
            <span>Filter Out Allergens:</span>
          </div>
          {selectedAllergenFilter && (
            <button
              onClick={() => setSelectedAllergenFilter(null)}
              className="text-xs font-semibold text-burgundy-600 hover:text-burgundy-800 underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allergensList.map((allergen) => {
            const isActive = selectedAllergenFilter === allergen;
            return (
              <button
                key={allergen}
                onClick={() =>
                  setSelectedAllergenFilter(isActive ? null : allergen)
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 border-2 border-red-500 font-bold'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-red-600" />}
                <span>Without {allergen}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            variant="default"
            hoverable
            onClick={() => setActiveItemDetails(item)}
            className="flex flex-col justify-between group"
          >
            <div>
              {/* Dish Visual Header */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {item.isPopular && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-burgundy-600 text-white shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Chef Pick
                    </span>
                  )}
                  {item.hasUnverifiedAllergens && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 text-white shadow-sm flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Allergen Info Pending
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-stone-900/80 text-white backdrop-blur-sm">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dish Content Body */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-burgundy-600 transition-colors">
                    {item.name}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Unverified Allergen Warning Banner on Card */}
                {item.hasUnverifiedAllergens && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Missing data &mdash; Not certified allergen-free. Inquire before dining.</span>
                  </div>
                )}

                {/* Dietary Tags & Allergens */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.dietaryTags.map((tag) => (
                    <Badge key={tag} variant="neutral" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {item.allergens.map((alg) => (
                    <Badge key={alg} variant="critical" size="sm">
                      Contains {alg}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety Verification Footer */}
            <div className="px-5 py-3 bg-cream-50 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <Thermometer className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[200px]">
                  {item.prepTemperature || 'Prepared under HACCP standards'}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                {item.temperatureLoggedAt || 'Logged today'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-display font-bold text-lg text-stone-800">
            No dishes match your allergen filter
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your filters to see more delicious options from our kitchen.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setSelectedAllergenFilter(null)}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Dish Safety & Structured Allergen Detail Modal */}
      {activeItemDetails && (
        <Modal
          isOpen={!!activeItemDetails}
          onClose={() => setActiveItemDetails(null)}
          title={activeItemDetails.name}
          subtitle={`Price: $${activeItemDetails.price.toFixed(2)} • ${activeItemDetails.category}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden h-44 w-full">
              <img
                src={activeItemDetails.imageUrl}
                alt={activeItemDetails.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              {activeItemDetails.description}
            </p>

            {/* Ingredients Declaration */}
            {activeItemDetails.ingredients && activeItemDetails.ingredients.length > 0 && (
              <div className="space-y-1.5 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <p className="font-bold uppercase text-stone-500 text-[10px] tracking-wide">
                  Declared Ingredients:
                </p>
                <p className="leading-relaxed font-medium">
                  {activeItemDetails.ingredients.join(', ')}
                </p>
              </div>
            )}

            {/* Structured Allergen Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Info className="w-4 h-4 text-stone-600" />
                Structured Allergen Matrix
              </h4>

              {activeItemDetails.hasUnverifiedAllergens && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-amber-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Allergen Information Incomplete / Not Provided
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This recipe contains ingredients whose cross-contact or trace allergen data has not been fully verified by the kitchen supervisor. PlateProof 360 strictly NEVER treats missing information as allergen-free.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {activeItemDetails.structuredAllergens && activeItemDetails.structuredAllergens.length > 0 ? (
                  activeItemDetails.structuredAllergens.map((alg) => {
                    const badgeVariants: Record<string, 'critical' | 'warning' | 'safety' | 'neutral'> = {
                      contains: 'critical',
                      may_contain: 'warning',
                      free_from: 'safety',
                      not_provided: 'neutral',
                    };

                    const labels: Record<string, string> = {
                      contains: 'CONTAINS',
                      may_contain: 'MAY CONTAIN (CROSS-CONTACT RISK)',
                      free_from: 'VERIFIED FREE FROM',
                      not_provided: 'UNKNOWN / NOT PROVIDED',
                    };

                    return (
                      <div
                        key={alg.allergen_code}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 bg-stone-50 text-xs"
                      >
                        <span className="font-bold uppercase text-stone-800">
                          {alg.allergen_code.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          {alg.notes && <span className="text-[11px] text-stone-400">{alg.notes}</span>}
                          <Badge variant={badgeVariants[alg.status] || 'neutral'} size="sm">
                            {labels[alg.status] || alg.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-stone-100 rounded-xl text-stone-600 text-xs">
                    No explicit allergen matrix submitted for this dish. Please inquire directly with the kitchen team.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" onClick={() => setActiveItemDetails(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
