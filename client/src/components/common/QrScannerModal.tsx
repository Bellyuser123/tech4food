import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Input } from './Input.js';
import { Badge } from './Badge.js';
import { ApiService } from '../../services/api.js';
import { QrResolutionResult } from '../../types/index.js';
import {
  QrCode,
  Scan,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  CheckCircle2,
  Camera,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolveSuccess: (result: QrResolutionResult) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onResolveSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'manual'>('simulator');
  const [manualToken, setManualToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const demoPresets = [
    {
      id: 'p1',
      title: 'Table 04 QR (Central District)',
      token: 'tbl_osteria_t04',
      type: 'table',
      description: 'Public menu with active Table 04 context & allergy notices.',
      badge: 'Public Table',
      badgeVariant: 'safety' as const,
    },
    {
      id: 'p2',
      title: 'Order #ORD-7294 (Served)',
      token: 'ord_token_7294',
      type: 'order',
      description: 'Opaque order token with verified HACCP cook & chiller logs.',
      badge: 'Served Order',
      badgeVariant: 'safety' as const,
    },
    {
      id: 'p3',
      title: 'Order #ORD-8812 (Preparing)',
      token: 'ord_token_8812',
      type: 'order',
      description: 'Active kitchen order with market bivalve allergen advisory.',
      badge: 'Allergen Caution',
      badgeVariant: 'warning' as const,
    },
    {
      id: 'p4',
      title: 'Expired Order Token',
      token: 'ord_token_expired',
      type: 'order',
      description: 'Order token expired after 24h for customer data protection.',
      badge: 'Expired Test',
      badgeVariant: 'danger' as const,
    },
    {
      id: 'p5',
      title: 'Revoked Table QR Code',
      token: 'tbl_osteria_revoked',
      type: 'table',
      description: 'QR code revoked by restaurant manager due to replacement.',
      badge: 'Revoked Test',
      badgeVariant: 'danger' as const,
    },
  ];

  const handleResolve = async (tokenToResolve: string) => {
    if (!tokenToResolve.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.resolveQrToken(tokenToResolve);
      setLoading(false);
      onResolveSuccess(result);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError({
        code: err.code || 'RESOLUTION_FAILED',
        message: err.message || 'Failed to resolve QR token.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PlateProof 360 QR Scanner"
      size="lg"
    >
      <div className="space-y-4">
        {/* Description Banner */}
        <div className="bg-cream-200/80 border border-cream-300 rounded-2xl p-3 flex items-center justify-between text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <Badge variant="safety" size="sm">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              Cryptographic Token
            </Badge>
            <span>Scan table QR or receipt order link to access verified records.</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 pb-2 gap-2 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('simulator');
              setError(null);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'simulator'
                ? 'bg-burgundy-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Quick Demo Presets
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setError(null);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-burgundy-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Manual Token / Camera Input
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {error.code === 'TOKEN_EXPIRED'
                  ? 'Access Link Expired'
                  : error.code === 'TOKEN_REVOKED'
                  ? 'QR Code Revoked'
                  : 'Resolution Failed'}
              </p>
              <p className="text-red-700 mt-0.5">{error.message}</p>
            </div>
          </div>
        )}

        {activeTab === 'simulator' ? (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            <p className="text-xs text-stone-500 font-medium">
              Click any scenario below to simulate scanning a physical restaurant QR stand or order docket:
            </p>
            {demoPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleResolve(preset.token)}
                className="group p-3.5 rounded-2xl border border-stone-200 hover:border-burgundy-600 bg-white hover:bg-burgundy-50/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-stone-900 group-hover:text-burgundy-700">
                      {preset.title}
                    </span>
                    <Badge variant={preset.badgeVariant} size="sm">
                      {preset.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {preset.description}
                  </p>
                  <p className="font-mono text-[10px] text-stone-400">
                    Token: {preset.token}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-burgundy-600 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
              <Camera className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs font-semibold text-stone-700">
                Camera Live Scanner
              </p>
              <p className="text-[11px] text-stone-500">
                You can scan QR codes using your device's native camera or paste any raw cryptographic token below.
              </p>
            </div>

            <div className="space-y-2">
              <Input
                label="Paste Raw QR Token or URL"
                placeholder="e.g. ord_token_7294 or tbl_osteria_t04"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
              />
              <Button
                variant="primary"
                className="w-full"
                disabled={loading || !manualToken.trim()}
                onClick={() => handleResolve(manualToken)}
              >
                {loading ? 'Resolving Token...' : 'Resolve QR Code'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
