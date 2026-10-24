import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Logo } from '../components/common/Logo.js';
import { useToast } from '../components/common/Toast.js';
import { Lock, Mail, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('supervisor@osteriaspina.demo');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<string>('supervisor');

  const demoAccounts = [
    { role: 'supervisor', label: 'Shift Supervisor', email: 'marco.supervisor@osteriaspina.demo' },
    { role: 'manager', label: 'Branch General Manager', email: 'elena.manager@osteriaspina.demo' },
    { role: 'cook', label: 'Line Cook / Prep', email: 'leo.cook@osteriaspina.demo' },
    { role: 'auditor', label: 'Platform Auditor', email: 'auditor@plateproof360.internal' },
  ];

  const handleQuickSelect = (acc: typeof demoAccounts[0]) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword('demo-safe-pass-2026');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'info',
      title: 'Phase 1 Scaffolding Mode',
      description: `Authenticated session simulated as ${email} (${selectedRole}). Full JWT auth arrives in Phase 3.`,
    });
    setTimeout(() => {
      onLoginSuccess();
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-28 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-stone-900">
          Restaurant Staff Portal
        </h2>
        <p className="text-xs text-stone-500">
          Sign in to log temperatures, verify corrective actions, or manage branch menus.
        </p>
      </div>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Staff Authentication</CardTitle>
          <CardDescription>Tenant-isolated access via cryptographic verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" variant="primary" fullWidth size="md">
              Sign In to Branch Portal
            </Button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-stone-100 space-y-2.5">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-burgundy-600" />
              Quick Demo Personas:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                    selectedRole === acc.role
                      ? 'bg-burgundy-50 border-burgundy-500 text-burgundy-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <p className="truncate font-semibold">{acc.label}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
