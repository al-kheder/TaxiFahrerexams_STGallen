"use client";

import { gradableIds } from "@/lib/repository";
import { mistakeIds, statsFor, useProgress } from "@/lib/progress";

/**
 * Small live summary on the home screen. Rendered as a client island so the
 * rest of the page stays a static server component.
 */
export function StatsStrip() {
  const { progress } = useProgress();
  const ids = gradableIds();
  const stats = statsFor(progress, ids);
  const mistakes = mistakeIds(progress).length;

  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      <Cell label="Bearbeitet" value={`${stats.answered}/${stats.total}`} />
      <Cell
        label="Genauigkeit"
        value={stats.answered === 0 ? "—" : `${Math.round(stats.accuracy * 100)}%`}
      />
      <Cell label="Offene Fehler" value={String(mistakes)} />
    </dl>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-2 py-3">
      <dd className="text-lg font-bold tabular-nums text-ink">{value}</dd>
      <dt className="mt-0.5 text-[11px] text-ink-muted">{label}</dt>
    </div>
  );
}
