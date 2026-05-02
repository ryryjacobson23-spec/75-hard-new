import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { WORKOUT_LABELS, formatDate } from '../lib/program';

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_exercises(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (data) setSessions(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-muted text-sm">Loading...</div></div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
        <h1 className="text-2xl font-semibold text-white mb-6">History</h1>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-white font-semibold mb-1">No workouts logged yet</div>
          <div className="text-muted text-sm">Start with today's session.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-6">History</h1>

      <div className="space-y-2">
        {sessions.map((session) => {
          const isOpen = expanded === session.id;
          const exercises = session.workout_exercises || [];

          return (
            <div key={session.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : session.id)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="text-left">
                  <div className="text-white font-semibold text-sm">
                    {WORKOUT_LABELS[session.workout_type]}
                  </div>
                  <div className="text-muted text-xs mt-0.5">
                    {formatDate(session.date)}
                    {session.duration_minutes && ` · ${session.duration_minutes} min`}
                    {exercises.length > 0 && ` · ${exercises.length} exercises`}
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 py-4">
                  {exercises.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-4 text-xs text-muted mb-2">
                        <span className="col-span-2">Exercise</span>
                        <span className="text-center">Sets × Reps</span>
                        <span className="text-right">Weight</span>
                      </div>
                      {[...exercises]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((ex) => (
                          <div key={ex.id} className="grid grid-cols-4 text-sm">
                            <span className="col-span-2 text-white">{ex.exercise_name}</span>
                            <span className="text-center text-muted">
                              {ex.sets && ex.reps ? `${ex.sets} × ${ex.reps}` : ex.sets || ex.reps || '—'}
                            </span>
                            <span className="text-right text-muted">
                              {ex.weight_lbs ? `${ex.weight_lbs} lbs` : '—'}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-muted text-sm mb-3">No exercises logged.</div>
                  )}
                  {session.notes && (
                    <div className="border-t border-border pt-3 text-muted text-sm">
                      {session.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
