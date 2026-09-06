import { ScopedPractice } from "@/components/ScopedPractice";

export const metadata = { title: "Üben — ARV 2" };

export default function UebenPage() {
  return (
    <ScopedPractice
      variant="ueben"
      heading="Üben"
      intro="Zuerst antworten, dann prüfen. So merkst du, was wirklich sitzt."
    />
  );
}
