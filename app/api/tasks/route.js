import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  await connectDB();
  const tasks = await Task.find()
    .sort({ createdAt: -1 })
    .populate("assignedTo", "name image")
    .populate("assignedBy", "name image")
    .lean(); // ✅ Return plain JS objects for speed
  return NextResponse.json(tasks);
}

export async function POST(request) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = session.user.id;
  const { car, needs, description, assignedTo, priority, status } =
    await request.json();

  if (!car || !car.trim()) {
    return NextResponse.json(
      { error: "The ‘car’ field is required." },
      { status: 400 }
    );
  }

  const data = {
    car,
    needs,
    description,
    priority,
    status,
    assignedBy: creatorId,
  };

  if (assignedTo) data.assignedTo = assignedTo;

  // ✅ Create task, then immediately fetch with .lean()
  const created = await Task.create(data);
  const populated = await Task.findById(created._id)
    .populate("assignedTo", "name image")
    .populate("assignedBy", "name image")
    .lean(); // ✅ lean here

  return NextResponse.json(populated);
}

export async function PATCH(request) {
  await connectDB();
  const { id, car, needs, description, assignedTo, priority, status } =
    await request.json();

  if (!car || !car.trim()) {
    return NextResponse.json(
      { error: "The ‘car’ field is required." },
      { status: 400 }
    );
  }

  const updates = { car, needs, description, priority, status };
  if (assignedTo) updates.assignedTo = assignedTo;

  const updated = await Task.findByIdAndUpdate(id, updates, { new: true })
    .populate("assignedTo", "name image")
    .populate("assignedBy", "name image")
    .lean(); // ✅ lean here too

  return NextResponse.json(updated);
}

export async function DELETE(request) {
  await connectDB();
  const { id } = await request.json();
  await Task.findByIdAndDelete(id);
  return NextResponse.json({ success: true }); // ✅ Simple response, no extra data
}
