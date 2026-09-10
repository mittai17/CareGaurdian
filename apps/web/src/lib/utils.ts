import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: { time?: boolean }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const base = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (opts?.time) {
    const t = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${base}, ${t}`;
  }
  return base;
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return formatDate(d);
}

export function getAge(dob: string | Date) {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function pct(value: number, baseline: number) {
  if (!baseline) return 0;
  return Math.round(((value - baseline) / baseline) * 100);
}

export function pctStr(value: number, baseline: number) {
  const p = pct(value, baseline);
  return p >= 0 ? `+${p}%` : `${p}%`;
}

export const statusConfig = {
  GOOD: {
    label: 'Good',
    emoji: '🟢',
    color: '#10b981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500',
  },
  STABLE: {
    label: 'Stable',
    emoji: '🟢',
    color: '#84cc16',
    bg: 'bg-lime-50',
    text: 'text-lime-700',
    border: 'border-lime-200',
    ring: 'ring-lime-500',
  },
  WATCH: {
    label: 'Watch',
    emoji: '🟡',
    color: '#eab308',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    ring: 'ring-yellow-500',
  },
  CONCERN: {
    label: 'Concern',
    emoji: '🟠',
    color: '#f97316',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    ring: 'ring-orange-500',
  },
  CRITICAL: {
    label: 'Critical',
    emoji: '🔴',
    color: '#ef4444',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    ring: 'ring-red-500',
  },
} as const;

export type YearStatus = keyof typeof statusConfig;

export const eventTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  MEDICATION_STARTED: { icon: '💊', label: 'Medication Started', color: 'text-blue-600' },
  MEDICATION_STOPPED: { icon: '💊', label: 'Medication Stopped', color: 'text-gray-600' },
  MEDICATION_CHANGED: { icon: '💊', label: 'Medication Changed', color: 'text-purple-600' },
  MISSED_MEDICATION: { icon: '💊', label: 'Missed Medication', color: 'text-orange-600' },
  FALL: { icon: '⚠️', label: 'Fall', color: 'text-red-600' },
  NEAR_FALL: { icon: '⚠️', label: 'Near Fall', color: 'text-orange-600' },
  HOSPITALIZATION: { icon: '🏥', label: 'Hospitalization', color: 'text-red-700' },
  ER_VISIT: { icon: '🚨', label: 'ER Visit', color: 'text-red-600' },
  SYMPTOM: { icon: '🩺', label: 'Symptom', color: 'text-gray-600' },
  COGNITIVE_CHANGE: { icon: '🧠', label: 'Cognitive Change', color: 'text-purple-600' },
  FUNCTIONAL_CHANGE: { icon: '🦽', label: 'Functional Change', color: 'text-blue-600' },
  APPETITE_CHANGE: { icon: '🍽️', label: 'Appetite Change', color: 'text-yellow-600' },
  SLEEP_CHANGE: { icon: '😴', label: 'Sleep Change', color: 'text-indigo-600' },
  MOBILITY_CHANGE: { icon: '🚶', label: 'Mobility Change', color: 'text-teal-600' },
  CAREGIVER_OBSERVATION: { icon: '👤', label: 'Care Circle Report', color: 'text-green-600' },
  LAB_RESULT: { icon: '🔬', label: 'Lab Result', color: 'text-cyan-600' },
  PROCEDURE: { icon: '⚕️', label: 'Procedure', color: 'text-blue-600' },
  DIAGNOSIS: { icon: '📋', label: 'Diagnosis', color: 'text-gray-700' },
  ASSESSMENT: { icon: '📊', label: 'Assessment', color: 'text-blue-600' },
};
