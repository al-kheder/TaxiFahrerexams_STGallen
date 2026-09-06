"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { OptionKey } from "./types";

const STORAGE_KEY = "arv2-progress-v1";

export interface QuestionProgress {
  /** Every answer given, newest last. Kept so accuracy reflects real history. */
  attempts: { chosen: OptionKey; correct: boolean; at: number }[];
}

export interface ProgressState {
  version: 1;
  questions: Record<string, QuestionProgress>;
  favorites: string[];
}

const EMPTY: ProgressState = { version: 1, questions: {}, favorites: [] };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed?.version !== 1 || typeof parsed.questions !== "object") return EMPTY;
    return {
      version: 1,
      questions: parsed.questions ?? {},
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    };
  } catch {
    // Private browsing, cleared storage, corrupt value -- start clean rather
    // than breaking the app over a convenience feature.
    return EMPTY;
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or blocked storage: progress simply will not survive a reload.
  }
}

function emit() {
  for (const l of listeners) l();
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = read();
    loaded = true;
  }
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ProgressState {
  ensureLoaded();
  return state;
}

/** The server render has no storage; always start from the empty state. */
function getServerSnapshot(): ProgressState {
  return EMPTY;
}

function update(next: ProgressState) {
  state = next;
  persist();
  emit();
}

export function useProgress() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordAnswer = useCallback(
    (questionId: string, chosen: OptionKey, correct: boolean) => {
      const existing = state.questions[questionId] ?? { attempts: [] };
      update({
        ...state,
        questions: {
          ...state.questions,
          [questionId]: {
            attempts: [...existing.attempts, { chosen, correct, at: Date.now() }],
          },
        },
      });
    },
    [],
  );

  const toggleFavorite = useCallback((questionId: string) => {
    const has = state.favorites.includes(questionId);
    update({
      ...state,
      favorites: has
        ? state.favorites.filter((id) => id !== questionId)
        : [...state.favorites, questionId],
    });
  }, []);

  const reset = useCallback(() => update({ ...EMPTY, favorites: [] }), []);

  return { progress: snapshot, recordAnswer, toggleFavorite, reset };
}

/* ---------- derived helpers (pure, so they are easy to test) ---------- */

export function lastAttempt(progress: ProgressState, questionId: string) {
  const attempts = progress.questions[questionId]?.attempts;
  return attempts?.length ? attempts[attempts.length - 1] : undefined;
}

export function isAnswered(progress: ProgressState, questionId: string): boolean {
  return !!lastAttempt(progress, questionId);
}

/**
 * A question counts as a "mistake" while its most recent answer was wrong.
 * Answering it correctly retires it from the mistake list, so the list shrinks
 * as the learner improves rather than accumulating forever.
 */
export function isMistake(progress: ProgressState, questionId: string): boolean {
  return lastAttempt(progress, questionId)?.correct === false;
}

export function mistakeIds(progress: ProgressState): string[] {
  return Object.keys(progress.questions).filter((id) => isMistake(progress, id));
}

export interface Stats {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export function statsFor(
  progress: ProgressState,
  questionIds: string[],
): Stats {
  let answered = 0;
  let correct = 0;
  for (const id of questionIds) {
    const last = lastAttempt(progress, id);
    if (!last) continue;
    answered += 1;
    if (last.correct) correct += 1;
  }
  return {
    total: questionIds.length,
    answered,
    correct,
    wrong: answered - correct,
    accuracy: answered === 0 ? 0 : correct / answered,
  };
}
