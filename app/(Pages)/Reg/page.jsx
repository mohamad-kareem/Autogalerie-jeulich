import { redirect } from "next/navigation";

// "Benutzer" now lives in the Einstellungen (like Autocenter)
export default function RegistrationPage() {
  redirect("/einstellungen#benutzer");
}
