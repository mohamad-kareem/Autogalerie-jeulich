export const fetchMobileCars = async () => {
  const { MOBILEDE_USERNAME, MOBILEDE_PASSWORD, MOBILEDE_SELLER_ID } =
    process.env;

  console.log("Using seller:", MOBILEDE_SELLER_ID);
  console.log("Using username:", MOBILEDE_USERNAME);

  const auth = Buffer.from(
    `${MOBILEDE_USERNAME}:${MOBILEDE_PASSWORD}`,
  ).toString("base64");

  const url = `https://services.mobile.de/seller-api/sellers/${MOBILEDE_SELLER_ID}/ads`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.de.mobile.api+json",
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  });

  const rawText = await res.text();

  console.log("mobile.de status:", res.status, res.statusText);
  console.log("mobile.de response:", rawText);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch cars from mobile.de (${res.status} ${res.statusText})`,
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    throw new Error("mobile.de returned invalid JSON");
  }

  console.log("Fetched ads count:", data.ads?.length || 0);
  return data.ads || [];
};
