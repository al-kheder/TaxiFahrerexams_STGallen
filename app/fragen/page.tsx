import { QuestionBrowser } from "@/components/QuestionBrowser";

export const metadata = { title: "Alle Fragen — ARV 2" };

export default async function FragenPage({
  searchParams,
}: {
  searchParams: Promise<{ nurPruefen?: string }>;
}) {
  const { nurPruefen } = await searchParams;
  return <QuestionBrowser initialOnlyFlagged={nurPruefen === "1"} />;
}
