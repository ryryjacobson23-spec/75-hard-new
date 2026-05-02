import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getDayNumber, toLocalDateString } from '../lib/program';

const TRACKED_LIFTS = [
  { key: 'Barbell bench press', label: 'Bench Press', color: '#e8f55a' },
  { key: 'Barbell back squat', label: 'Back Squat', color: '#c8f55a' },
  { key: 'Deadlift', label: 'Deadlift', color: '#5af5e8' },
  { key: 'Overhead press', label: 'Overhead Press', color: '#f5a85a' },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs">
        <div className="text-muted mb-1">{label}</div>
        <div className="text-white font-semibold">{payload[0].value} lbs</div>
      </div>
    );
  }
  return null;
}

export default function Progress() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [liftData, setLiftData] = useState({});
  const [bodyStats, setBodyStats] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [settingsRes, exercisesRes, bodyRes, checklistRes] = await Promise.all([
      supabase.from('program_settings').select('*').eq('user_id', user.id).single(),
      supabase
        .from('workout_exercises')
        .select('exercise_name, weight_lbs, workout_sessions(date)')
        .eq('workout_sessions.user_id', user.id)
        .not('weight_lbs', 'is', null),
      supabase.from('body_stats').select('*').eq('user_id', user.id).order('date'),
      supabase.from('daily_checklist').select('*').eq('user_id', user.id).order('date'),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);

    // Process lift data
    if (exercisesRes.data) {
      const byLift = {};
      for (const row of exercisesRes.data) {
        if (!row.workout_sessions) continue;
        const date = row.workout_sessions.date;
        const name = row.exercise_name;
        if (!byLift[name]) byLift[name] = {};
        if (!byLift[name][date] || row.weight_lbs > byLift[name][date]) {
          byLift[name][date] = row.weight_lbs;
        }
      }
      const formatted = {};
      for (const [name, dates] of Object.entries(byLift)) {
        formatted[name] = Object.entries(dates)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, weight]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight,
          }));
      }
      setLiftData(formatted);
    }

    if (bodyRes.data) setBodyStats(bodyRes.data.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: r.weight_lbs,
    })));

    if (checklistRes.data) {
      const isComplete = (r) => r.lifted !== false && r.active_done && r.ate_clean && r.drank_water && r.code_session;
      setHeatmap(checklistRes.data.map(r => ({
        date: r.date,
        complete: isComplete(r),
        partial: !isComplete(r) && (r.active_done || r.ate_clean || r.drank_water || r.code_session),
      })));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveWeight = async () => {
    if (!newWeight) return;
    setSavingWeight(true);
    const today = toLocalDateString();
    await supabase.from('body_stats').upsert({
      user_id: user.id,
      date: today,
      weight_lbs: parseFloat(newWeight),
    }, { onConflict: 'user_id,date' });
    setNewWeight('');
    setSavingWeight(false);
    loadData();
  };

  const dayNumber = getDayNumber(settings?.start_date);
  const progress = dayNumber ? Math.min((dayNumber / 75) * 100, 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-muted text-sm">Loading...</div></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-6">Progress</h1>

      {/* 75-day progress bar */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-white font-semibold">Program Progress</span>
          <span className="text-accent font-semibold">{dayNumber ? `Day ${dayNumber}` : 'Not started'}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: '#e8f55a' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>Day 1</span>
          <span>{dayNumber ? `${Math.round(progress)}% complete` : 'Set start date in Settings'}</span>
          <span>Day 75</span>
        </div>
      </div>

      {/* Heatmap */}
      {heatmap.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="text-white font-semibold text-sm mb-3">Streak Calendar</div>
          <div className="flex flex-wrap gap-1">
            {heatmap.map(({ date, complete, partial }) => (
              <div
                key={date}
                title={date}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: complete ? '#c8f55a' : partial ? '#e8f55a44' : '#282826',
                }}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{backgroundColor:'#c8f55a'}} /> All complete</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{backgroundColor:'#e8f55a44'}} /> Partial</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-border" /> Not logged</span>
          </div>
        </div>
      )}

      {/* Lift charts */}
      {TRACKED_LIFTS.map(({ key, label, color }) => {
        const data = liftData[key];
        if (!data || data.length < 2) return null;
        return (
          <div key={key} className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="text-white font-semibold text-sm mb-4">{label}</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282826" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6960' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b6960' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      {Object.values(liftData).every(d => !d || d.length < 2) && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-4">
          <div className="text-muted text-sm">Log at least 2 sessions with the same lift to see progress charts.</div>
        </div>
      )}

      {/* Body weight */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="text-white font-semibold text-sm mb-3">Body Weight</div>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            placeholder="Today's weight (lbs)"
            className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={saveWeight}
            disabled={savingWeight || !newWeight}
            className="bg-accent text-bg font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:opacity-90"
          >
            Log
          </button>
        </div>

        {bodyStats.length >= 2 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bodyStats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282826" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6960' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b6960' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight" stroke="#f5a85a" strokeWidth={2} dot={{ fill: '#f5a85a', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted text-sm text-center py-4">Log at least 2 entries to see your weight trend.</div>
        )}
      </div>
    </div>
  );
}
