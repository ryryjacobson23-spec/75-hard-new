import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getDayNumber, getTodayWorkout, toLocalDateString, WORKOUT_LABELS } from '../lib/program';

const DEFAULT_CHECKLIST = {
  lifted: false,
  active_done: false,
  ate_clean: false,
  drank_water: false,
  code_session: false,
};

const CHECKLIST_ITEMS = [
  {
    key: 'lifted',
    liftLabel: (workout) => `Lift — ${WORKOUT_LABELS[workout?.type] || 'Workout'}`,
    activeLabel: 'Active Session',
    color: '#c8f55a',
    icon: LiftIcon,
    isLiftOnly: true,
  },
  {
    key: 'active_done',
    liftLabel: 'Cardio finisher done',
    activeLabel: 'Active session done',
    color: '#5af5e8',
    icon: RunIcon,
    isLiftOnly: false,
  },
  {
    key: 'ate_clean',
    liftLabel: 'Ate clean + hit protein',
    activeLabel: 'Ate clean + hit protein',
    color: '#f5a85a',
    icon: FoodIcon,
    isLiftOnly: false,
  },
  {
    key: 'drank_water',
    liftLabel: '1 gallon of water',
    activeLabel: '1 gallon of water',
    color: '#5af5e8',
    icon: WaterIcon,
    isLiftOnly: false,
  },
  {
    key: 'code_session',
    liftLabel: 'Claude Code session (30+ min)',
    activeLabel: 'Claude Code session (30+ min)',
    color: '#b05af5',
    icon: CodeIcon,
    isLiftOnly: false,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [checklistId, setChecklistId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ totalDone: 0, currentStreak: 0, liftsLogged: 0, bestStreak: 0 });
  const [animating, setAnimating] = useState({});
  const [loading, setLoading] = useState(true);

  const todayWorkout = getTodayWorkout();
  const today = toLocalDateString();

  const loadData = useCallback(async () => {
    if (!user) return;

    const [settingsRes, checklistRes, allChecklistRes, workoutsRes] = await Promise.all([
      supabase.from('program_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('daily_checklist').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('daily_checklist').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('workout_sessions').select('id, date').eq('user_id', user.id),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);

    if (checklistRes.data) {
      setChecklistId(checklistRes.data.id);
      setChecklist({
        lifted: checklistRes.data.lifted,
        active_done: checklistRes.data.active_done,
        ate_clean: checklistRes.data.ate_clean,
        drank_water: checklistRes.data.drank_water,
        code_session: checklistRes.data.code_session,
      });
    }

    if (allChecklistRes.data) {
      const rows = allChecklistRes.data;
      const isComplete = (r) => r.lifted !== false && r.active_done && r.ate_clean && r.drank_water && r.code_session;

      let streak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      const sortedDates = [...rows].sort((a, b) => new Date(b.date) - new Date(a.date));

      for (let i = 0; i < sortedDates.length; i++) {
        const r = sortedDates[i];
        if (isComplete(r)) {
          if (i === 0 || streak > 0) streak++;
        } else {
          if (r.date === today) streak = 0;
          else break;
        }
      }

      for (const r of rows) {
        if (isComplete(r)) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      const totalDone = rows.filter(isComplete).length;
      setStats({
        totalDone,
        currentStreak: streak,
        liftsLogged: workoutsRes.data?.length || 0,
        bestStreak,
      });
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = async (key) => {
    const newValue = !checklist[key];
    const newChecklist = { ...checklist, [key]: newValue };
    setChecklist(newChecklist);

    setAnimating(a => ({ ...a, [key]: true }));
    setTimeout(() => setAnimating(a => ({ ...a, [key]: false })), 300);

    const payload = {
      user_id: user.id,
      date: today,
      lifted: newChecklist.lifted,
      active_done: newChecklist.active_done,
      ate_clean: newChecklist.ate_clean,
      drank_water: newChecklist.drank_water,
      code_session: newChecklist.code_session,
    };

    if (checklistId) {
      await supabase.from('daily_checklist').update(payload).eq('id', checklistId);
    } else {
      const { data } = await supabase.from('daily_checklist').insert(payload).select().single();
      if (data) setChecklistId(data.id);
    }
  };

  const dayNumber = getDayNumber(settings?.start_date);
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = todayWorkout?.isLift ? 5 : 4;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      {/* Day counter */}
      <div className="text-center mb-8">
        {dayNumber ? (
          <>
            <div className="text-accent font-semibold text-8xl leading-none mb-1">{dayNumber}</div>
            <div className="text-muted text-sm uppercase tracking-widest">of 75 days</div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-muted text-sm mb-2">Program not started</div>
            <Link to="/settings" className="text-accent text-sm font-semibold">Set start date →</Link>
          </div>
        )}
      </div>

      {/* Today's workout */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted text-xs uppercase tracking-widest mb-1">Today</div>
            <div className="text-white font-semibold">{todayWorkout.label}</div>
            <div className="text-muted text-sm">{todayWorkout.sublabel}</div>
          </div>
          <Link
            to="/log"
            className="bg-accent text-bg text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Log workout
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      {dayNumber && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>{completedCount}/{totalItems} tasks today</span>
            <span>{Math.round((dayNumber / 75) * 100)}% through program</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${(dayNumber / 75) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <div className="text-white font-semibold text-sm">Today's Checklist</div>
        </div>
        <div>
          {CHECKLIST_ITEMS.map((item, i) => {
            if (item.key === 'lifted' && !todayWorkout?.isLift) return null;
            const label = todayWorkout?.isLift ? item.liftLabel(todayWorkout) : item.activeLabel;
            const checked = checklist[item.key];
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/5 ${
                  i < CHECKLIST_ITEMS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    animating[item.key] ? 'check-pop' : ''
                  }`}
                  style={{
                    borderColor: checked ? item.color : '#282826',
                    backgroundColor: checked ? item.color : 'transparent',
                  }}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#0c0c0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-1 text-left">
                  <Icon color={checked ? item.color : '#6b6960'} />
                  <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-muted'}`}>
                    {label}
                  </span>
                </div>
                {checked && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Days Done', value: stats.totalDone },
          { label: 'Streak', value: stats.currentStreak },
          { label: 'Lifts', value: stats.liftsLogged },
          { label: 'Best', value: stats.bestStreak },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-white font-semibold text-xl">{value}</div>
            <div className="text-muted text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiftIcon({ color }) {
  return (
    <svg width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2m0 0v12m0-12h4m-4 6h4m0-6v12m0-6h4m0 0V6m0 6h4m0-6v12m0-6h2" />
    </svg>
  );
}

function RunIcon({ color }) {
  return (
    <svg width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5a1 1 0 100-2 1 1 0 000 2zm-2 4l-2 8m2-8l2 3-2 2m0 0l-1 3m1-3l3 1" />
    </svg>
  );
}

function FoodIcon({ color }) {
  return (
    <svg width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function WaterIcon({ color }) {
  return (
    <svg width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z" />
    </svg>
  );
}

function CodeIcon({ color }) {
  return (
    <svg width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}
