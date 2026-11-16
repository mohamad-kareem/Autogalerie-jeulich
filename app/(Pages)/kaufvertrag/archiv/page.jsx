import { redirect } from "next/navigation";

export default async function ArchivePage({ searchParams }) {
  const { tab } = (await searchParams) ?? {};
  const params = new URLSearchParams({ scope: "archive" });
  if (typeof tab === "string") params.set("tab", tab);
  redirect(`/kaufvertrag/liste?${params}`);
}
