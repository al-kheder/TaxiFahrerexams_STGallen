"use client";

import Link from "next/link";
import { PracticeSession } from "./PracticeSession";
import { questionsByIds } from "@/lib/repository";
import { mistakeIds, useProgress } from "@/lib/progress";

/**
 * Sessions whose question list comes from stored progress rather than from a
 * fixed scope: the mistake queue and the favourites list.
 */
export function MistakesSession() {
  const { progress } = useProgress();
  const questions = questionsByIds(mistakeIds(progress));

  return (
    <div className="flex flex-col gap-4">
      <BackLink />
      <PracticeSession
        questions={questions}
        title="Meine Fehler"
        variant="ueben"
        emptyMessage="Zurzeit keine offenen Fehler. Sobald du eine Frage falsch beantwortest, erscheint sie hier — und verschwindet wieder, sobald du sie richtig hast."
      />
    </div>
  );
}

export function FavouritesSession() {
  const { progress } = useProgress();
  const questions = questionsByIds(progress.favorites);

  return (
    <div className="flex flex-col gap-4">
      <BackLink />
      <PracticeSession
        questions={questions}
        title="Gemerkte Fragen"
        variant="ueben"
        emptyMessage="Noch nichts gemerkt. Tippe bei einer Frage auf „☆ Merken“, um sie hier zu sammeln."
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="self-start text-sm font-medium text-brand no-underline">
      ← Startseite
    </Link>
  );
}
