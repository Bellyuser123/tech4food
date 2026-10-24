import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api.js';
import { ApiHealthResponse } from '../../types/index.js';
import { ShieldCheck, AlertCircle, RefreshCw, Database } from 'lucide-react';

export const ApiHealthBadge: React.FC = () => {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to REST API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'ok';
  const isDegraded = health?.status === 'degraded';

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-200/90 shadow-sm hover:border-stone-300 transition-all cursor-pointer"
        title="Click to view API & Database Health"
      >
        <span className="relative flex h-2.5 w-2.5">
          {loading ? (
            <span className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-stone-400 border-t-transparent" />
          ) : isHealthy ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </>
          ) : isDegraded ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          )}
        </span>

        <span className="text-stone-700">
          API:{' '}
          {loading
            ? 'Checking...'
            : isHealthy
            ? 'Connected'
            : isDegraded
            ? 'Degraded (DB Offline)'
            : 'Unreachable'}
        </span>
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-dropdown border border-stone-200 p-4 z-50 text-left animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-burgundy-600" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                System Diagnostics
              </span>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs text-stone-600">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Service:</span>
              <span className="font-semibold text-stone-800">
                {health?.service || 'PlateProof 360 REST API'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">API Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : isDegraded
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {health?.status || (error ? 'Offline' : 'Checking')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500 flex items-center gap-1">
                <Database className="w-3 h-3" /> PostgreSQL:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  health?.database.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {health?.database.status || 'Not connected'}
              </span>
            </div>

            {health?.database.latencyMs !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-stone-500">DB Latency:</span>
                <span className="font-mono text-stone-800">{health.database.latencyMs}ms</span>
              </div>
            )}

            {health?.uptimeSeconds !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Uptime:</span>
                <span className="font-mono text-stone-800">{health.uptimeSeconds}s</span>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-700 text-[11px] flex items-start gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
