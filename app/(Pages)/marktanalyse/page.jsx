import { redirect } from "next/navigation";
import { staffUser } from "@/lib/kaufvertragServer";
import MarktanalyseClient from "./MarktanalyseClient";

export const metadata = {
  title: "Marktanalyse",
  robots: { index: false, follow: false },
};

export default async function MarktanalysePage({ searchParams }) {
  const user = await staffUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  return <MarktanalyseClient initialView={params?.einstellungen === "1" ? "einstellungen" : "analyse"} />;
}
