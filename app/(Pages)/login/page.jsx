// app/admin/login/page.jsx (Server Component)
import LoginPage from "./LoginPage";

export default function AdminLoginWrapper({ searchParams }) {
  const callbackUrl = searchParams?.callbackUrl || "/AdminDashboard";

  return <LoginPage callbackUrl={callbackUrl} />;
}
