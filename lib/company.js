// The company – used by the Ankaufbestätigung (e-mail text, footer) and the driving time.
// Change these values once here.

export const COMPANY = {
  key: "ag",
  name: "Autogalerie Jülich",
  street: "Alte Dürener Straße 4",
  zip: "52428",
  city: "Jülich",
  phone: "02461 916006613",
  email: "autogalerie.juelich@web.de",
  web: "www.autogalerie-juelich.de",
};

/** The company stamp, line by line – printed next to the seller's signature when chosen. */
export const COMPANY_STAMP = [
  "Autogalerie Jülich",
  "Inh. Hussein Karim",
  "Tel: 015234205041",
  "Alte Dürenerstraße 4, 52428 Jülich",
];

export const companyLine = `${COMPANY.name} · ${COMPANY.street} · ${COMPANY.zip} ${COMPANY.city}`;
