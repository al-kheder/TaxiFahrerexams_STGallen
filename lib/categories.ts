import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
}

/**
 * The source groups its questions into five "Teile" by position, not by topic.
 * These categories are derived from the subject matter so a learner can drill
 * one area at a time; they are a navigation aid the app adds.
 */
export const CATEGORIES: Category[] = [
  {
    id: "geltungsbereich",
    label: "Geltungsbereich & Begriffe",
    description: "Wer und was der ARV 2 untersteht, Definitionen",
  },
  {
    id: "arbeitszeit",
    label: "Arbeitszeit & Überzeit",
    description: "Arbeitszeit, Höchstarbeitszeit, Überstunden und Ausgleich",
  },
  {
    id: "lenkzeit",
    label: "Lenkzeit & Lenkpause",
    description: "Tägliche und wöchentliche Lenkzeit, Pausen am Steuer",
  },
  {
    id: "arbeitspause",
    label: "Arbeitspausen",
    description: "Länge, Aufteilung und Verteilung der Arbeitspause",
  },
  {
    id: "ruhezeit",
    label: "Ruhezeit & Ruhetage",
    description: "Tägliche Ruhezeit, Ruhetage, Ersatzruhe, freie Halbtage",
  },
  {
    id: "fahrtschreiber",
    label: "Fahrtschreiber & Einlageblätter",
    description: "Bedienung des Fahrtschreibers, Blätter und Wochenbündel",
  },
  {
    id: "arbeitsbuch",
    label: "Arbeitsbuch & Tagesblatt",
    description: "Führung des Arbeitsbuchs, Tagesblatt, Befreiungen",
  },
  {
    id: "kontrolle",
    label: "Pflichten & Kontrolle",
    description: "Notfall, Aufstellung, Arbeitgeberpflichten, Aufbewahrung",
  },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_BY_ID.get(id)?.label ?? id;
}
