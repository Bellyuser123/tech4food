import React, { useEffect, useState } from 'react';
import { DEMO_RESTAURANT } from '../data/mockData.js';
import { RestaurantProfile } from '../types/index.js';
import { ApiService } from '../services/api.js';
import { Card, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import {
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Star,
  QrCode,
  Thermometer,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface RestaurantProfilePageProps {
  onNavigateToMenu: () => void;
  onNavigateToComplaint: () => void;
}

export const RestaurantProfilePage: React.FC<RestaurantProfilePageProps> = ({
  onNavigateToMenu,
  onNavigateToComplaint,
}) => {
  const [profile, setProfile] = useState<RestaurantProfile>(DEMO_RESTAURANT);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number>(0);

  useEffect(() => {
    // Attempt live fetch from REST API
    ApiService.getPublicRestaurantProfile('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .then((data) => {
        if (data) {
          setProfile((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch((err) => {
        console.info('Operating in offline demo fallback mode:', err.message);
      });
  }, []);

  const branches = profile.branches || [
    {
      id: 'b-1',
      name: 'Central District (Branch 01)',
      code: 'BR-01',
      address: profile.address,
      phone: profile.phone,
    },
    {
      id: 'b-2',
      name: 'North Harbor Waterfront (Branch 02)',
      code: 'BR-02',
      address: '88 Marina Way, North Harbor Waterfront',
      phone: '+1 (555) 019-4822',
    },
  ];

  const currentBranch = branches[activeBranchIndex] || branches[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Demo Notice Banner */}
      <div className="bg-cream-200/80 border border-cream-300 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-stone-700">
        <div className="flex items-center gap-2">
          <Badge variant="demo" size="sm">Demo Environment</Badge>
          <span>Fictional sample restaurant. Not an official municipal government endorsement.</span>
        </div>
        <span className="hidden sm:inline text-stone-400 font-mono">Tenant ID: rest-001</span>
      </div>

      {/* Hero Banner with Food Visual & Verification Stamp */}
      <div className="relative rounded-3xl overflow-hidden shadow-card border border-stone-200/80 bg-stone-900 min-h-[320px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 text-white">
        <img
          src={profile.bannerUrl || DEMO_RESTAURANT.bannerUrl}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="safety" size="md" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Platform Verified: Clean Kitchen
            </Badge>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {profile.rating || 4.8} (520+ Reviews)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 text-cream-100 backdrop-blur-sm">
              <QrCode className="w-3.5 h-3.5" /> Table 04 Active
            </span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
            {profile.name}
          </h1>

          <p className="text-sm sm:text-base text-cream-100 max-w-2xl leading-relaxed">
            {profile.description || DEMO_RESTAURANT.description}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-cream-200">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-burgundy-400 shrink-0" />
              {currentBranch.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-burgundy-400 shrink-0" />
              {profile.openingHours || 'Tue – Sun: 12:00 PM – 10:30 PM'}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-burgundy-400 shrink-0" />
              {currentBranch.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Branch Selector Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wide">
          <Building2 className="w-4 h-4 text-burgundy-600" />
          <span>Select Operating Branch:</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {branches.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setActiveBranchIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeBranchIndex === idx
                  ? 'bg-burgundy-600 text-white shadow-sm'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Distinct Transparency Card: Restaurant Submitted vs Platform Verified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Submitted by Restaurant */}
        <Card variant="default">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <FileText className="w-4 h-4 text-stone-500" />
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wide">
                Submitted by Restaurant Operator
              </h3>
            </div>
            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <p>
                <strong>Trading Name:</strong> {profile.name}
              </p>
              <p>
                <strong>Branch Address:</strong> {currentBranch.address}
              </p>
              <p>
                <strong>Stated Operating Hours:</strong> {profile.openingHours || '12:00 PM – 10:30 PM'}
              </p>
              <p>
                <strong>Declared License:</strong> {profile.officialLicense || 'DEMO-REG-2026-904'}
              </p>
              <p className="text-[11px] text-stone-400 italic pt-1">
                Note: Operational hours, descriptions, and branch contacts are self-maintained by the restaurant manager.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verified by Platform */}
        <Card variant="cream">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cream-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Verified by Platform Audit
                </h3>
              </div>
              <Badge variant="safety" size="sm">Verified Active</Badge>
            </div>
            <div className="space-y-2 text-xs text-stone-700 leading-relaxed">
              <p>
                <strong>Inspection Audit Source:</strong> Municipal Food Safety Authority &amp; Platform Inspection Register
              </p>
              <p>
                <strong>Verification Timestamp:</strong> 15 Oct 2026, 10:00 UTC
              </p>
              <p>
                <strong>Audit Register Hash:</strong> <span className="font-mono text-[11px] text-stone-500">e82f...a109</span>
              </p>
              <p className="text-[11px] text-emerald-800 font-medium pt-1">
                ✓ Identity authenticated and dual-control compliance enabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety & Accountability Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                HACCP Temperature
              </p>
              <h4 className="text-xl font-extrabold text-stone-900 mt-0.5">99.8% Pass</h4>
              <p className="text-[11px] text-emerald-700 font-medium">All chillers in safe limits</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-burgundy-100 text-burgundy-800 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                Allergen Transparency
              </p>
              <h4 className="text-xl font-extrabold text-stone-900 mt-0.5">14 Allergens</h4>
              <p className="text-[11px] text-burgundy-700 font-medium">Clear unknown states</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                Supervisor Sign-off
              </p>
              <h4 className="text-xl font-extrabold text-stone-900 mt-0.5">Dual-Control</h4>
              <p className="text-[11px] text-amber-800 font-medium">Server enforced check</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          onClick={onNavigateToMenu}
          className="group p-6 rounded-3xl bg-white border-2 border-stone-200/80 hover:border-burgundy-600 shadow-card hover:shadow-cardHover transition-all text-left flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-burgundy-50 text-burgundy-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-burgundy-600 transition-colors">
                Browse Verified Safe Menu
              </h3>
            </div>
            <p className="text-xs text-stone-500 max-w-sm pl-11">
              Explore ingredients, filter declared allergens, and view live prep temperature logs for each dish.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-burgundy-600 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </button>

        <button
          onClick={onNavigateToComplaint}
          className="group p-6 rounded-3xl bg-white border-2 border-stone-200/80 hover:border-amber-500 shadow-card hover:shadow-cardHover transition-all text-left flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                Report a Food-Safety Issue
              </h3>
            </div>
            <p className="text-xs text-stone-500 max-w-sm pl-11">
              Report an allergic reaction, foreign object, or illness. No account required; get a private tracking code.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </button>
      </div>
    </div>
  );
};
