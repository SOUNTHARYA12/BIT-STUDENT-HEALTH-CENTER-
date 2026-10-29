import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import {
  Bot,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Info,
} from 'lucide-react';

export const AIHealthTriage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [duration, setDuration] = useState('1 to 2 days');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commonCampusSymptoms = [
    'Fever / Elevated Temperature',
    'Throbbing Headache / Migraine',
    'Sore Throat / Dysphagia',
    'Cough & Chest Congestion',
    'Sports Ankle Sprain / Joint Pain',
    'Acidity / Stomach Cramps',
    'Skin Rash / Allergic Itching',
    'Nausea / Food Poisoning',
    'Eye Strain / Photophobia',
  ];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleEvaluate = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select or specify at least one symptom for preliminary evaluation.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await apiFetch('/api/student/triage-evaluate', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          severity,
          duration,
          additionalNotes,
        }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to complete triage analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded uppercase tracking-wider">
              AI Clinical Decision Support
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Institutional Protocol Engine</span>
          </div>
          <h1 className="text-xl font-bold text-[#0f2942]">AI Health Triage Assistant</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated collegiate symptom checker for preliminary triage, home care guidance, and OPD specialty matching.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Non-diagnostic screening tool</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            
            {/* Step 1: Select Symptoms */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. Select Experienced Symptoms
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonCampusSymptoms.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#007d79] text-white border-[#007d79] font-medium shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Symptom */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder="Or type another symptom and press Enter..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Step 2: Severity and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mild', 'moderate', 'severe'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-2 px-1 text-xs capitalize font-medium rounded-lg border text-center transition cursor-pointer ${
                        severity === lvl
                          ? lvl === 'severe'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-[#007d79] text-white border-[#007d79]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  3. Symptom Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
                >
                  <option value="Less than 24 hours">Less than 24 hours</option>
                  <option value="1 to 2 days">1 to 2 days</option>
                  <option value="3 to 5 days">3 to 5 days</option>
                  <option value="More than a week">More than a week</option>
                </select>
              </div>
            </div>

            {/* Step 3: Additional Notes */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                4. Additional Context (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g., fever started after basketball practice in sports ground; mild throat ache in Cauvery hostel room..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Evaluate CTA */}
            <button
              type="button"
              disabled={loading || selectedSymptoms.length === 0}
              onClick={handleEvaluate}
              className="w-full py-3 bg-[#007d79] hover:bg-[#006864] text-white font-medium text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing clinical markers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-200" />
                  <span>Run AI Health Triage Analysis</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Output Assessment Card */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-700" />
                  <h3 className="font-bold text-sm text-slate-900">Triage Classification</h3>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    result.urgencyLevel === 'emergency'
                      ? 'bg-rose-100 text-rose-800'
                      : result.urgencyLevel === 'consultation_recommended'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {result.urgencyLevel.replace('_', ' ')}
                </span>
              </div>

              {/* Primary Assessment */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Recommended Action
                </span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {result.primaryAdvice}
                </p>
                <div className="text-[11px] text-teal-800 font-medium pt-1">
                  Matched Specialist: {result.recommendedSpecialist}
                </div>
              </div>

              {/* Home Care Protocols */}
              {result.homeCareTips && result.homeCareTips.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Hostel Self-Care Measures
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                    {result.homeCareTips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red-flag Warnings */}
              {result.warningSigns && result.warningSigns.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1 text-xs text-amber-900">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Emergency Signs to Watch
                  </div>
                  <ul className="pl-4 list-disc space-y-0.5 text-[11px] text-amber-800">
                    {result.warningSigns.map((warn: string, i: number) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Book Appointment CTA */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/student/book')}
                  className="w-full py-2.5 bg-[#007d79] hover:bg-[#006864] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment with Doctor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-700">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Assessment Run Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Select your symptoms on the left to receive institutional triage recommendation and matched doctor specializations.
              </p>
              <div className="pt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2 text-left">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  For acute injuries or breathing difficulty, call <strong>Ext 108</strong> immediately without waiting for triage analysis.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
