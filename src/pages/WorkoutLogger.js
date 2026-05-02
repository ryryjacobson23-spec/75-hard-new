import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { EXERCISES, WORKOUT_LABELS, getTodayWorkout, toLocalDateString } from '../lib/program';

const TYPES = ['upper', 'lower', 'push', 'pull', 'legs', 'active'];

function emptyExercise(name = '') {
  return { name, sets: '', reps: '', weight: '' };
}

export default function WorkoutLogger() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayWorkout = getTodayWorkout();

  const [workoutType, setWorkoutType] = useState(todayWorkout?.type || 'upper');
  const [exercises, setExercises] = useState(() =>
    (EXERCISES[todayWorkout?.type] || []).map(emptyExercise)
  );
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customExercise, setCustomExercise] = useState('');

  const changeType = (type) => {
    setWorkoutType(type);
    setExercises((EXERCISES[type] || []).map(emptyExercise));
  };

  const updateExercise = (i, field, value) => {
    setExercises(ex => ex.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const addCustom = () => {
    if (!customExercise.trim()) return;
    setExercises(ex => [...ex, emptyExercise(customExercise.trim())]);
    setCustomExercise('');
  };

  const removeExercise = (i) => {
    setExercises(ex => ex.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    setError('');
    setSaving(true);

    try {
      const today = toLocalDateString();

      const { data: session, error: sessionErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          date: today,
          workout_type: workoutType,
          notes: notes.trim() || null,
          duration_minutes: duration ? parseInt(duration) : null,
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      const filledExercises = exercises.filter(e => e.name.trim() && (e.sets || e.reps || e.weight));
      if (filledExercises.length > 0) {
        const exerciseRows = filledExercises.map((e, idx) => ({
          session_id: session.id,
          exercise_name: e.name,
          sets: e.sets ? parseInt(e.sets) : null,
          reps: e.reps ? parseInt(e.reps) : null,
          weight_lbs: e.weight ? parseFloat(e.weight) : null,
          order_index: idx,
        }));

        const { error: exErr } = await supabase.from('workout_exercises').insert(exerciseRows);
        if (exErr) throw exErr;
      }

      // Also mark lifted/active on checklist
      const checklistField = todayWorkout?.isLift ? 'lifted' : 'active_done';
      const existing = await supabase
        .from('daily_checklist')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existing.data) {
        await supabase
          .from('daily_checklist')
          .update({ [checklistField]: true })
          .eq('id', existing.data.id);
      } else {
        await supabase.from('daily_checklist').insert({
          user_id: user.id,
          date: today,
          lifted: todayWorkout?.isLift ? true : false,
          active_done: !todayWorkout?.isLift ? true : false,
          ate_clean: false,
          drank_water: false,
          code_session: false,
        });
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isActive = workoutType === 'active';

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-6">Log Workout</h1>

      {/* Type selector */}
      <div className="mb-6">
        <div className="text-muted text-xs uppercase tracking-widest mb-2">Workout Type</div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => changeType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                workoutType === t
                  ? 'bg-accent text-bg'
                  : 'bg-card border border-border text-muted hover:text-white'
              }`}
            >
              {WORKOUT_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Active: duration + notes only */}
      {isActive ? (
        <div className="space-y-4">
          <div>
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="45"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you do today?"
              rows={4}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Exercise list */}
          <div className="space-y-3 mb-4">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white text-sm font-semibold">{ex.name || 'Exercise'}</div>
                  <button
                    onClick={() => removeExercise(i)}
                    className="text-muted hover:text-red-400 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['sets', 'reps', 'weight'].map(field => (
                    <div key={field}>
                      <div className="text-muted text-xs mb-1 capitalize">{field === 'weight' ? 'lbs' : field}</div>
                      <input
                        type="number"
                        value={ex[field]}
                        onChange={e => updateExercise(i, field, e.target.value)}
                        placeholder={field === 'weight' ? '135' : field === 'sets' ? '3' : '10'}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom exercise */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={customExercise}
              onChange={e => setCustomExercise(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add exercise..."
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={addCustom}
              className="bg-card border border-border rounded-xl px-4 py-3 text-muted hover:text-white transition-colors text-sm"
            >
              Add
            </button>
          </div>

          {/* Duration */}
          <div className="mb-4">
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Duration (minutes, optional)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="60"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it feel? Any PRs?"
              rows={3}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-accent text-bg font-semibold py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Session'}
      </button>
    </div>
  );
}
