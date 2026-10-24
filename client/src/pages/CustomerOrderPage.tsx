import React, { useState, useEffect } from 'react';
import { CustomerOrderView } from '../types/index.js';
import { ApiService } from '../services/api.js';
import { Card, CardContent } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import {
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Thermometer,
  ArrowRight,
  AlertOctagon,
} from 'lucide-react';

interface CustomerOrderPageProps {
  orderToken?: string;
  orderData?: CustomerOrderView | null;
  onNavigateToMenu: () => void;
  onNavigateToComplaint: (orderRef?: string) => void;
}

export const CustomerOrderPage: React.FC<CustomerOrderPageProps> = ({
  orderToken = 'ord_token_7294',
  orderData: initialData,
  onNavigateToMenu,
  onNavigateToComplaint,
}) => {
  const [order, setOrder] = useState<CustomerOrderView | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setOrder(initialData);
      setLoading(false);
      return;
    }

    if (!orderToken) return;

    setLoading(true);
    setError(null);

    ApiService.getOrderByToken(orderToken)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.warn('Failed to load live order by token:', err);
        setError({
          code: err.code || 'LOAD_ERROR',
          message: err.message || 'Unable to retrieve order transparency record.',
        });
        setLoading(false);
      });
  }, [orderToken, initialData]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-burgundy-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="font-display font-bold text-xl text-stone-900">
          Decrypting Secure Order Transparency...
        </h2>
        <p className="text-xs text-stone-500">
          Validating cryptographic QR token and fetching kitchen prep logs.
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card variant="bordered" className="border-red-300 bg-red-50/50 text-center p-8 space-y-4">
          <div className="p-4 bg-red-100 text-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-red-950">
            {error?.code === 'TOKEN_EXPIRED'
              ? 'Order Access Link Expired'
              : error?.code === 'TOKEN_REVOKED'
              ? 'QR Code Revoked'
              : 'Order Not Found'}
          </h2>
          <p className="text-sm text-red-800 max-w-md mx-auto leading-relaxed">
            {error?.message ||
              'The requested order transparency details are unavailable or the cryptographic token is invalid.'}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" onClick={onNavigateToMenu}>
              Browse Public Menu
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigateToComplaint(order?.orderReference)}
            >
              Report a Food Concern
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { id: 'placed', label: 'Order Placed' },
    { id: 'preparing', label: 'In Kitchen' },
    { id: 'safety_check', label: 'Safety Checked' },
    { id: 'served', label: 'Served' },
  ];

  const currentStepIndex =
    order.status === 'served' || order.status === 'completed'
      ? 3
      : order.status === 'preparing'
      ? 1
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="safety" size="sm">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            Verified Order Link
          </Badge>
          <span className="font-medium">
            Zero PII: Customer name and payment info are never exposed in QR records.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[11px] text-emerald-700">
          Ref: {order.orderReference}
        </span>
      </div>

      {/* Order Header Card */}
      <Card variant="cream" className="overflow-hidden border border-burgundy-900/10">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cream-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-burgundy-700 text-white tracking-wide">
                  {order.tableNumber}
                </span>
                <span className="text-xs text-stone-500 font-mono font-medium">
                  #{order.orderReference}
                </span>
                <Badge variant="demo" size="sm">
                  Live Order Feed
                </Badge>
              </div>
              <h1 className="font-display font-extrabold text-2xl text-stone-900 mt-1">
                {order.restaurant?.name || 'Osteria Della Spina'}
              </h1>
              <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-burgundy-600 shrink-0" />
                {order.branch?.name || 'Central District (Branch 01)'} &bull;{' '}
                {order.branch?.address}
              </p>
            </div>

            <div className="sm:text-right text-xs text-stone-500 space-y-1">
              <span className="flex items-center sm:justify-end gap-1 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                Placed: {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                Status: {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stepper */}
          <div className="pt-2">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {steps.map((st, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={st.id} className="space-y-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCompleted
                          ? 'bg-burgundy-600'
                          : 'bg-stone-200'
                      }`}
                    />
                    <p
                      className={`font-semibold text-[11px] sm:text-xs ${
                        isCurrent
                          ? 'text-burgundy-700 font-bold'
                          : isCompleted
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {st.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ordered Items Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-burgundy-600" />
            Ordered Dishes &amp; Allergen Transparency ({order.items.length})
          </h2>
          <span className="text-xs text-stone-500 font-medium">Table Docket Breakdown</span>
        </div>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <Card key={idx} variant="default" className="p-4 hover:shadow-card transition-all">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-xs font-bold">
                      {item.quantity}x
                    </span>
                    <h3 className="font-display font-bold text-base text-stone-900">
                      {item.name}
                    </h3>
                    <span className="text-sm font-bold text-burgundy-700">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {item.special_allergen_notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Special Allergen Note: {item.special_allergen_notes}</span>
                    </div>
                  )}

                  {/* Ingredients */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <p className="text-xs text-stone-500 leading-relaxed">
                      <strong>Ingredients:</strong> {item.ingredients.join(', ')}
                    </p>
                  )}

                  {/* Allergen Matrix Chips */}
                  <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                    {item.has_unverified_allergens && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Unverified Allergen Caution
                      </span>
                    )}

                    {item.allergens &&
                      item.allergens.map((alg, aIdx) => {
                        if (alg.status === 'contains') {
                          return (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-200"
                            >
                              Contains {alg.allergen_code.toUpperCase()}
                            </span>
                          );
                        }
                        if (alg.status === 'may_contain') {
                          return (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                            >
                              May contain {alg.allergen_code}
                            </span>
                          );
                        }
                        if (alg.status === 'free_from') {
                          return (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                            >
                              ✓ {alg.allergen_code} Free
                            </span>
                          );
                        }
                        return (
                          <span
                            key={aIdx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200"
                          >
                            ? {alg.allergen_code} (Unconfirmed)
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* HACCP Kitchen Preparation Safety Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-emerald-600" />
            Verified HACCP Preparation Logs
          </h2>
          <Badge variant="safety" size="sm">
            Audited Checks
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {order.safetyChecks && order.safetyChecks.length > 0 ? (
            order.safetyChecks.map((sc, sIdx) => (
              <Card
                key={sIdx}
                variant={sc.is_safe ? 'default' : 'cream'}
                className="p-4 space-y-2 border-l-4 border-l-emerald-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-stone-900">{sc.check_type}</p>
                    <p className="text-[11px] text-stone-500">{sc.target_threshold}</p>
                  </div>
                  <Badge variant={sc.is_safe ? 'safety' : 'warning'} size="sm">
                    {sc.is_safe ? 'Passed' : 'Caution'}
                  </Badge>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900 font-mono text-sm">
                    {sc.reading_or_status}
                  </span>
                  <span className="text-stone-500 text-[11px]">{sc.logged_by_role}</span>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
              No individual CCP readings logged for this demo batch.
            </div>
          )}
        </div>
      </div>

      {/* Safety Caution Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Customer Allergen Caution Notice</span>
        </div>
        <p>{order.allergyAdvisoryNotice}</p>
      </div>

      {/* Bottom Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => onNavigateToComplaint(order.orderReference)}
          className="group p-5 rounded-2xl bg-white border-2 border-stone-200 hover:border-red-600 shadow-sm transition-all text-left flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Report Issue on this Order</span>
            </div>
            <p className="text-xs text-stone-500">
              Allergic reaction, undercooked food, or foreign object. Pre-fills Ref #{order.orderReference}.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-red-700 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
        </button>

        <button
          onClick={onNavigateToMenu}
          className="group p-5 rounded-2xl bg-white border-2 border-stone-200 hover:border-burgundy-600 shadow-sm transition-all text-left flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-burgundy-700 font-bold text-sm">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Browse Full Restaurant Menu</span>
            </div>
            <p className="text-xs text-stone-500">
              Explore wine pairings, desserts, chef specials, and allergen filters.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-burgundy-600 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
        </button>
      </div>
    </div>
  );
};
