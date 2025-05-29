export const fetchMobileCars = async () => {
  const { MOBILEDE_USERNAME, MOBILEDE_PASSWORD, MOBILEDE_SELLER_ID } =
    process.env;

  const auth = Buffer.from(
    `${MOBILEDE_USERNAME}:${MOBILEDE_PASSWORD}`
  ).toString("base64");

  const res = await fetch(
    `https://services.mobile.de/seller-api/sellers/${MOBILEDE_SELLER_ID}/ads`,
    {
      headers: {
        Accept: "application/vnd.de.mobile.api+json",
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!res.ok) {
    console.error("mobile.de fetch error", await res.text());
    throw new Error("Failed to fetch cars from mobile.de");
  }

  const data = await res.json();
  console.dir(data.ads[0], { depth: null });

  return data.ads || [];
};
