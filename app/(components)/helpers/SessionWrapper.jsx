"use client";

import { useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

/**
 * Ends the session on this device once the login is no longer valid —
 * e.g. after "Auf allen Geräten abmelden" on another computer.
 */
function SessionGuard() {
  const { data } = useSession();
  useEffect(() => {
    if (data?.invalidUser) signOut({ callbackUrl: "/login" });
  }, [data?.invalidUser]);
  return null;
}

export default function SessionWrapper({ children }) {
  // The session is checked every minute and when the tab gets focus, so an
  // open page on another computer notices the logout within about a minute.
  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      <SessionGuard />
      {children}
    </SessionProvider>
  );
}
