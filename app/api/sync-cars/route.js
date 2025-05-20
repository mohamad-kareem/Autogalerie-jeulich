export async function GET() {
  await connectDB();

  const username = process.env.MOBILEDE_USERNAME;
  const password = process.env.MOBILEDE_PASSWORD;
  const sellerId = process.env.MOBILEDE_SELLER_ID;

  try {
    const response = await fetch(
      `https://services.mobile.de/seller-api/sellers/${sellerId}/ads`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${username}:${password}`
          ).toString("base64")}`,
          Accept: "application/vnd.de.mobile.api+json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    const ads = data.ads || [];

    const formattedCars = ads.map((ad) => ({
      mobileAdId: ad.mobileAdId,
      title: `${ad.make} ${ad.model}`,
      make: ad.make,
      model: ad.model,
      year: Number(ad.firstRegistration?.slice(0, 4)) || null,
      mileage: ad.mileage || 0,
      price: parseFloat(ad.price?.consumerPriceGross) || 0,
      currency: ad.price?.currency || "EUR",
      fuel: ad.fuel,
      gearbox: ad.gearbox,
      description: ad.description || "",
      images: (ad.images || []).map((img) => img.ref),
    }));

    // upsert all cars
    for (const car of formattedCars) {
      await Car.updateOne(
        { mobileAdId: car.mobileAdId },
        { $set: car },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, count: formattedCars.length });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync cars" }, { status: 500 });
  }
}
