"use client";

import { useEffect, useState } from "react";

export type ThemeChoice = "hell" | "dunkel" | "system";

export const THEME_KEY = "arv2-theme";

/**
 * The script that runs before first paint, inlined by the layout. Kept here so
 * the storage key and the resolution rule live next to the component that
 * writes them -- if these two disagree, the page flashes the wrong theme.
 */
export const THEME_BOOTSTRAP = `(function(){try{
var c=localStorage.getItem(${JSON.stringify(THEME_KEY)})||"system";
var d=c==="dunkel"||(c!=="hell"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.dataset.theme=d?"dark":"light";
}catch(e){document.documentElement.dataset.theme="light";}})();`;

function apply(choice: ThemeChoice) {
  const dark =
    choice === "dunkel" ||
    (choice !== "hell" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

const OPTIONS: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: "hell", label: "Hell", icon: "☀" },
  { value: "dunkel", label: "Dunkel", icon: "☾" },
  { value: "system", label: "System", icon: "🖥" },
];

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: ThemeChoice = "system";
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw === "hell" || raw === "dunkel" || raw === "system") stored = raw;
    } catch {
      // Blocked storage: fall back to following the system.
    }
    setChoice(stored);
    setMounted(true);
  }, []);

  // While "system" is selected, keep following the OS if it changes mid-session.
  useEffect(() => {
    if (choice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  function pick(next: ThemeChoice) {
    setChoice(next);
    apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // The choice still applies for this page view.
    }
  }

  return (
    <div
      role="group"
      aria-label="Farbschema"
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        // Before mount every button renders unselected, so the server and the
        // client agree; the real selection appears immediately after hydration.
        const active = mounted && choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => pick(option.value)}
            aria-pressed={active}
            title={option.label}
            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-brand text-white"
                : "text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            <span aria-hidden>{option.icon}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
