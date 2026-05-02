export const WORKOUT_TYPES = ['upper', 'lower', 'push', 'pull', 'legs', 'active'];

export const DAY_WORKOUTS = {
  1: { type: 'upper', label: 'Upper Body', sublabel: '+ Cardio Finisher', isLift: true },
  2: { type: 'lower', label: 'Lower Body', sublabel: '+ Cardio Finisher', isLift: true },
  3: { type: 'active', label: 'Active Day', sublabel: '35–50 min run, bike, swim, or hike', isLift: false },
  4: { type: 'push', label: 'Push', sublabel: '+ Cardio Finisher', isLift: true },
  5: { type: 'pull', label: 'Pull', sublabel: '+ Cardio Finisher', isLift: true },
  6: { type: 'legs', label: 'Legs', sublabel: '+ Cardio Finisher', isLift: true },
  0: { type: 'active', label: 'Active Day', sublabel: 'Easy run, swim, or walk — 30–45 min', isLift: false },
};

export const EXERCISES = {
  upper: [
    'Barbell bench press',
    'Barbell/dumbbell row',
    'Overhead press',
    'Lat pulldown',
    'Incline dumbbell press',
    'Cable face pulls',
    'EZ bar curls',
    'Overhead tricep extension',
  ],
  lower: [
    'Barbell back squat',
    'Romanian deadlift',
    'Leg press',
    'Walking lunges',
    'Leg curl',
    'Standing calf raise',
    'Ab wheel/cable crunch',
  ],
  push: [
    'Incline barbell/dumbbell press',
    'Dumbbell lateral raises',
    'Dumbbell chest fly',
    'Arnold press',
    'Tricep rope pushdowns',
    'Skull crushers',
    'Front raises',
  ],
  pull: [
    'Deadlift',
    'Pull-ups',
    'Seated cable row',
    'Single arm dumbbell row',
    'Rear delt fly',
    'Incline dumbbell curl',
    'Hammer curls',
  ],
  legs: [
    'Front squat/hack squat',
    'Bulgarian split squat',
    'Leg extension',
    'Lying leg curl',
    'Hip thrust',
    'Seated calf raise',
  ],
  active: [],
};

export function getDayNumber(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  if (diff < 1 || diff > 75) return null;
  return diff;
}

export function getTodayWorkout() {
  const day = new Date().getDay();
  return DAY_WORKOUTS[day];
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const WORKOUT_LABELS = {
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  active: 'Active',
};

export const WORKOUT_COLORS = {
  upper: '#c8f55a',
  lower: '#c8f55a',
  push: '#c8f55a',
  pull: '#c8f55a',
  legs: '#c8f55a',
  active: '#5af5e8',
};
