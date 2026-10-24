import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Textarea } from '../components/common/Input.js';
import { Badge } from '../components/common/Badge.js';
import { useToast } from '../components/common/Toast.js';
import {
  Search,
  CheckCircle2,
  FileQuestion,
  ExternalLink,
  Lock,
  PhoneCall,
  Clock,
} from 'lucide-react';

interface CustomerComplaintPageProps {
  initialOrderReference?: string;
}

export const CustomerComplaintPage: React.FC<CustomerComplaintPageProps> = ({
  initialOrderReference,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit form state
  const [allegationType, setAllegationType] = useState<string>('food_poisoning');
  const [description, setDescription] = useState<string>('');
  const [incidentTime, setIncidentTime] = useState<string>('');
  const [orderReference, setOrderReference] = useState<string>(initialOrderReference || '');

  React.useEffect(() => {
    if (initialOrderReference) {
      setOrderReference(initialOrderReference);
    }
  }, [initialOrderReference]);
  const [contactInfo, setContactInfo] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState<string | null>(null);

  // Track state
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');
  const [trackedRecord, setTrackedRecord] = useState<{
    code: string;
    status: string;
    date: string;
    allegation: string;
    resolution: string;
  } | null>(null);

  const symptomOptions = [
    'Nausea / Vomiting',
    'Abdominal Cramps',
    'Fever / Chills',
    'Skin Rash / Hives',
    'Oral Tingling / Swelling',
    'Diarrhoea',
  ];

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast({
        type: 'error',
        title: 'Description required',
        description: 'Please describe the safety or hygiene issue you experienced.',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Generate a realistic opaque tracking code
      const code = `PP360-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedTrackingCode(code);
      showToast({
        type: 'success',
        title: 'Report submitted securely',
        description: `Your private tracking code is ${code}. Save this to view investigation updates.`,
      });
    }, 800);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCodeInput.trim()) return;

    // Simulate lookup
    setTrackedRecord({
      code: trackingCodeInput.toUpperCase(),
      status: 'Under Investigation',
      date: '24 Oct 2026, 05:30 UTC',
      allegation: 'Potential temperature breach / cross-contact',
      resolution:
        'A corrective action has been assigned to Kitchen Supervisor Marco S. Dual-control verification required before public outcome closure.',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Emergency Alert Banner */}
      <div className="p-4 rounded-2xl bg-burgundy-900 text-white shadow-card flex items-start gap-3.5">
        <PhoneCall className="w-5 h-5 text-burgundy-300 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white flex items-center gap-2">
            Acute Emergency or Severe Allergic Reaction?
          </p>
          <p className="text-xs text-cream-200 leading-relaxed">
            If you are experiencing anaphylaxis, breathing distress, or severe poisoning, immediately dial your local emergency services (such as 911 / 999 / 112). Do not wait for digital reports to resolve acute medical hazards.
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Submit vs Track */}
      <div className="flex bg-cream-200 p-1 rounded-2xl border border-cream-300">
        <button
          onClick={() => setActiveTab('submit')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'submit'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Submit Food Safety Incident
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'track'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Track Existing Report
        </button>
      </div>

      {activeTab === 'submit' ? (
        generatedTrackingCode ? (
          /* Submission Confirmation Card */
          <Card variant="default">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="safety" size="md">
                  Report Encrypted & Stored
                </Badge>
                <h2 className="font-display font-extrabold text-2xl text-stone-900">
                  Incident Received
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Your incident has been securely recorded in the restaurant audit register. No public account is needed to view progress.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-100 border-2 border-dashed border-stone-300 max-w-sm mx-auto">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                  Your Private Tracking Code
                </p>
                <p className="font-mono text-2xl font-black text-burgundy-700 mt-1">
                  {generatedTrackingCode}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Keep this code confidential to review restaurant response.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={() => {
                    setTrackingCodeInput(generatedTrackingCode);
                    setActiveTab('track');
                    setGeneratedTrackingCode(null);
                  }}
                >
                  Track Status Now
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setGeneratedTrackingCode(null);
                    setDescription('');
                    setSelectedSymptoms([]);
                  }}
                >
                  Submit Another Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Incident Intake Form */
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report a Food Safety Concern</CardTitle>
                  <CardDescription>
                    Osteria Della Spina &mdash; Branch 01 (Opaque & Anonymous Allowed)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Private by Default
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Issue Category <span className="text-burgundy-600">*</span>
                  </label>
                  <select
                    value={allegationType}
                    onChange={(e) => setAllegationType(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-burgundy-600"
                  >
                    <option value="food_poisoning">Foodborne Illness / Food Poisoning</option>
                    <option value="allergen_mishap">Undeclared Allergen / Cross-Contact</option>
                    <option value="foreign_object">Foreign Object Contamination (Glass, Plastic, Hair)</option>
                    <option value="temperature_abuse">Undercooked Meat / Lukewarm Temperature</option>
                    <option value="hygiene_violation">Staff Hygiene / Sanitation Violation</option>
                    <option value="other">Other Food Quality Concern</option>
                  </select>
                </div>

                {/* Symptoms Multi-Checklist */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Observed Symptoms (if applicable)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {symptomOptions.map((sym) => {
                      const isChecked = selectedSymptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          onClick={() => handleToggleSymptom(sym)}
                          className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                            isChecked
                              ? 'bg-burgundy-50 border-burgundy-600 text-burgundy-900 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <Textarea
                  label="Detailed Incident Description"
                  required
                  rows={4}
                  placeholder="Please state what you consumed, when the symptoms began, or any foreign item observed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  helperText="Your narrative is kept private from public display by default."
                />

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date & Approximate Time"
                    type="datetime-local"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                  />
                  <Input
                    label="Table / Order Reference (Optional)"
                    placeholder="e.g. Table 04 or Receipt #8401"
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                  />
                </div>

                {/* Contact Information (Optional) */}
                <Input
                  label="Contact For Investigation Follow-up (Optional)"
                  placeholder="Email or phone (stored hashed; never sold or shared)"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  helperText="Leave empty to remain 100% anonymous."
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  Submit Incident Report Privately
                </Button>
              </form>
            </CardContent>
          </Card>
        )
      ) : (
        /* Tracking Tab */
        <Card variant="default">
          <CardHeader>
            <CardTitle>Track Incident Status</CardTitle>
            <CardDescription>
              Lookup investigation logs and corrective action verification with your private tracking code.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleTrack} className="flex gap-2">
              <Input
                placeholder="e.g. PP360-123456"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="font-mono uppercase"
              />
              <Button type="submit" variant="primary">
                Lookup
              </Button>
            </form>

            {trackedRecord ? (
              <div className="p-5 rounded-2xl bg-cream-50 border border-cream-300 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-stone-900">
                    {trackedRecord.code}
                  </span>
                  <Badge variant="warning" size="md">
                    {trackedRecord.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <p>
                    <strong className="text-stone-800">Allegation:</strong> {trackedRecord.allegation}
                  </p>
                  <p className="flex items-center gap-1.5 text-stone-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Logged on {trackedRecord.date}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                  <p className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Restaurant Action & Findings
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {trackedRecord.resolution}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-400 space-y-2">
                <FileQuestion className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-xs">
                  Enter your tracking code above to check live investigation status.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Official Referral Workflow Box */}
      <div className="p-5 rounded-2xl bg-stone-100 border border-stone-200 space-y-2 text-xs text-stone-600">
        <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
          <ExternalLink className="w-4 h-4 text-stone-700" />
          Official Health Authority Referral Notice
        </h4>
        <p className="leading-relaxed">
          PlateProof 360 provides internal restaurant accountability and transparent public records. It does not replace statutory municipal or state food authority reporting. If you wish to report directly to official government bodies, please visit your local Food Safety Authority or Department of Health portal.
        </p>
      </div>
    </div>
  );
};
