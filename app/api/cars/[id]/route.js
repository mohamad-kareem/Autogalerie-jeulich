import { NextResponse } from "next/server";

import { getCar } from "@/lib/cars/queries";

/** GET /api/cars/:id — one car of the public stock. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const car = await getCar(id);
    if (!car) return NextResponse.json({ message: "Fahrzeug nicht gefunden." }, { status: 404 });
    return NextResponse.json(car);
  } catch (error) {
    console.error("GET /api/cars/:id failed:", error?.message);
    return NextResponse.json({ message: "Serverfehler." }, { status: 500 });
  }
}
