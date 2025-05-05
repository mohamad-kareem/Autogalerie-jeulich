// app/reset-password/page.jsx

import ResetPasswordPage from "./ResetPasswordPage";

export default function ResetPasswordWrapper({ searchParams }) {
  const token = searchParams?.token || "";

  return <ResetPasswordPage token={token} />;
}
