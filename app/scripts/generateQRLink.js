import { generatePunchToken } from "@/lib/jwt";

const admins = [
  { id: "68178118c5fb3ddec126d6cb", name: "Mohamad Karim" },
  { id: "681920f44bdfe905a7d61776", name: "Hsen" },
  // ➕ Add more admins here as needed
];

const baseUrl = "https://autogaleriejülich.de/api/punch/qr";

admins.forEach((admin) => {
  const token = generatePunchToken(admin.id);
  const url = `${baseUrl}?token=${token}`;
  console.log(`✅ QR Punch Link for ${admin.name}:`);
  console.log(url);
  console.log();
});
