import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('program_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setStartDate(data.start_date || '');
      setBodyweight(data.bodyweight_lbs ? String(data.bodyweight_lbs) : '');
    }
  }, [user]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.from('program_settings').upsert({
      user_id: user.id,
      start_date: startDate || null,
      bodyweight_lbs: bodyweight ? parseInt(bodyweight) : null,
    }, { onConflict: 'user_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = async () => {
    setResetting(true);
    await Promise.all([
      supabase.from('program_settings').delete().eq('user_id', user.id),
      supabase.from('daily_checklist').delete().eq('user_id', user.id),
    ]);
    setStartDate('');
    setBodyweight('');
    setShowReset(false);
    setResetting(false);
  };

  const proteinTarget = bodyweight ? parseInt(bodyweight) : null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-6">Settings</h1>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-4">
        <div className="p-4">
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Program Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors [color-scheme:dark]"
          />
          <div className="text-muted text-xs mt-1.5">Used to calculate "Day X of 75"</div>
        </div>

        <div className="p-4">
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Bodyweight (lbs)</label>
          <input
            type="number"
            value={bodyweight}
            onChange={e => setBodyweight(e.target.value)}
            placeholder="185"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors"
          />
          {proteinTarget && (
            <div className="text-muted text-xs mt-1.5">
              Daily protein target: <span className="text-orange">{proteinTarget}g</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-accent text-bg font-semibold py-3.5 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50 mb-4"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Settings'}
      </button>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-4">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-semibold">Account</div>
            <div className="text-muted text-xs mt-0.5">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="text-muted text-sm hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-red-900/30 rounded-2xl p-4">
        <div className="text-red-400 text-sm font-semibold mb-1">Danger Zone</div>
        <div className="text-muted text-xs mb-3">Resets your program start date and all daily checklist data. Workout sessions are preserved.</div>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-red-400 text-sm border border-red-900/50 rounded-xl px-4 py-2 hover:bg-red-400/10 transition-colors"
          >
            Reset Program
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-white text-sm">Are you sure? This cannot be undone.</div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                disabled={resetting}
                className="bg-red-500 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="bg-card border border-border text-muted px-4 py-2 rounded-xl text-sm hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
