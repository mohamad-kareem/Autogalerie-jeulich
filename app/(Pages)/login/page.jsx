// app/(Pages)/login/page.jsx
import LoginPage from "./LoginPage";

export default async function AdminLoginWrapper({ searchParams }) {
  const callbackUrl = searchParams?.callbackUrl || "/";
  return <LoginPage callbackUrl={callbackUrl} />;
}
