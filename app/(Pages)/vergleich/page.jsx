import ComparisonWrapper from "./ComparisonWrapper";

export default function VergleichPage({ searchParams }) {
  const ids = searchParams?.ids?.split(",").filter(Boolean) || [];
  return <ComparisonWrapper ids={ids} />;
}
