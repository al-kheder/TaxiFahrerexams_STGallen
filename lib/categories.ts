import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  labelAr: string;
  description: string;
}

/**
 * The source sheets print no category labels. These are derived from the
 * subject matter of the questions themselves, which follow the same thematic
 * order on all three sheets. They are a navigation aid the app adds -- not
 * headings taken from the exam.
 */
export const CATEGORIES: Category[] = [
  {
    id: "geltungsbereich",
    label: "Geltungsbereich & Alkohol",
    labelAr: "نطاق التطبيق والكحول",
    description: "Wer der ARV 2 untersteht, wo sie gilt, Alkoholverbot",
  },
  {
    id: "lenkzeit",
    label: "Lenkzeit & Lenkpause",
    labelAr: "مدة القيادة والاستراحة",
    description: "Tägliche und wöchentliche Lenkzeit, Pausen am Steuer",
  },
  {
    id: "arbeitszeit",
    label: "Arbeitszeit & Überzeit",
    labelAr: "ساعات العمل والساعات الإضافية",
    description: "Präsenzzeit, Höchstarbeitszeit, Überstunden",
  },
  {
    id: "arbeitspause",
    label: "Arbeitspausen",
    labelAr: "فترات الراحة أثناء العمل",
    description: "Länge und Unterteilung der Arbeitspause",
  },
  {
    id: "ruhezeit",
    label: "Ruhezeit & Ruhetage",
    labelAr: "فترات الراحة والأيام الحرة",
    description: "Tägliche Ruhezeit, Verkürzung, wöchentlicher Ruhetag",
  },
  {
    id: "kontrolle",
    label: "Fahrtschreiber & Arbeitsbuch",
    labelAr: "جهاز التسجيل ودفتر العمل",
    description: "Fahrtschreiber, Einlageblätter, Arbeitsbuch, Kontrolle",
  },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_BY_ID.get(id)?.label ?? id;
}
