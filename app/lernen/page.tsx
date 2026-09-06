import { ScopedPractice } from "@/components/ScopedPractice";

export const metadata = { title: "Lernen — ARV 2" };

export default function LernenPage() {
  return (
    <ScopedPractice
      variant="lernen"
      heading="Lernen"
      intro="Antwort und Erklärung erscheinen sofort. Gut für den ersten Durchgang."
    />
  );
}
