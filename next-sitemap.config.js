// next-sitemap.config.js
// Runs after every build (postbuild) and writes public/sitemap*.xml and
// public/robots.txt. Those files are generated, so they are not committed.

// Staff-only pages (see ADMIN_PATHS in app/(components)/helpers/LayoutWrapper.jsx)
// and the login pages. Each entry also covers its sub-pages.
const INTERNAL = [
  "/admin",
  "/forms",
  "/AdminDashboard",
  "/aufgabenboard",
  "/einstellungen",
  "/excel",
  "/Fahrzeugverwaltung",
  "/Fotostudio",
  "/kaufvertrag",
  "/Kundenkontakte",
  "/Lagerbestand",
  "/marktanalyse",
  "/neue-angebote",
  "/PersonalData",
  "/Plate",
  "/Posteingang",
  "/preisschild",
  "/punch-qr",
  "/punsh",
  "/Reg",
  "/Rotkennzeichen",
  "/schlussel",
  "/show-qr",
  "/Toni-Werkstatt",
  "/translator",
  "/Zeiterfassungsverwaltung",
  "/login",
  "/forgotpassword",
  "/reset-password",
];

// Kept out of the sitemap, but not named in the public robots.txt.
const UNLISTED = ["/TrackVisitors76546633"];

module.exports = {
  siteUrl: "https://autogaleriejülich.de",
  generateRobotsTxt: true,
  exclude: [...INTERNAL, ...UNLISTED].flatMap((path) => [path, `${path}/*`]),
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: INTERNAL }],
  },
};
