// app/api/tasks/route.js
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
    .lean();
  return NextResponse.json(tasks);
}

export async function POST(request) {
  await connectDB();

  // Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const creatorId = session.user.id;

  const { car, needs, description, assignedTo, priority } =
    await request.json();

  if (!car || !car.trim()) {
    return NextResponse.json(
      { error: "The ‘car’ field is required." },
      { status: 400 }
    );
  }

  const data = { car, needs, description, priority, assignedBy: creatorId };
  if (assignedTo) data.assignedTo = assignedTo;

  const task = await Task.create(data);
  await task.populate([
    { path: "assignedTo", select: "name image" },
    { path: "assignedBy", select: "name image" },
  ]);
  return NextResponse.json(task);
}

export async function PATCH(request) {
  await connectDB();
  const { id, car, needs, description, assignedTo, priority } =
    await request.json();

  if (!car || !car.trim()) {
    return NextResponse.json(
      { error: "The ‘car’ field is required." },
      { status: 400 }
    );
  }

  const updates = { car, needs, description, priority };
  if (assignedTo) updates.assignedTo = assignedTo;

  const task = await Task.findByIdAndUpdate(id, updates, { new: true })
    .populate("assignedTo", "name image")
    .populate("assignedBy", "name image");
  return NextResponse.json(task);
}

export async function DELETE(request) {
  await connectDB();
  const { id } = await request.json();
  await Task.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
