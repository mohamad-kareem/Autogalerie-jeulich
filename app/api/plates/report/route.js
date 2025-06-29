import { connectDB } from "@/lib/mongodb";
import PlateUsage from "@/models/PlateUsage";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const startDate = new Date(searchParams.get("startDate"));
    const endDate = new Date(searchParams.get("endDate"));
    const plateNumber = searchParams.get("plateNumber");

    const query = {
      startTime: { $gte: startDate, $lte: endDate },
    };

    if (plateNumber !== "all") {
      query.plateNumber = plateNumber;
    }

    const usage = await PlateUsage.find(query).sort({ startTime: 1 }).lean();
    console.log("Sample entry:", usage[0]);
    // Generate report data (could be enhanced with more analytics)
    const reportData = {
      summary: {
        totalRecords: usage.length,
        uniquePlates: [...new Set(usage.map((u) => u.plateNumber))].length,
        totalHours: usage.reduce((sum, u) => {
          const end = u.endTime ? new Date(u.endTime) : new Date();
          return sum + (end - new Date(u.startTime)) / (1000 * 60 * 60);
        }, 0),
      },
      details: usage,
    };

    return new Response(JSON.stringify(reportData), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
