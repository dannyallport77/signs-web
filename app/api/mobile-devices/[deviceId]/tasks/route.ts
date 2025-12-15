import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/mobile-devices/[deviceId]/tasks
 * Poll for pending NFC programming tasks for a device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { deviceId } = params;

    // Get pending tasks for this device
    const tasks = await prisma.nFCProgrammingTask.findMany({
      where: {
        deviceId,
        status: "pending",
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mobile-devices/[deviceId]/tasks/[taskId]
 * Update task status (acknowledge, writing, completed, failed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { status, lastError } = await request.json();

    const task = await prisma.nFCProgrammingTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deviceId !== params.deviceId) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const updateData: any = { status };

    if (status === "acknowledged") {
      updateData.acknowledgedAt = new Date();
    } else if (status === "completed") {
      updateData.completedAt = new Date();
    } else if (status === "failed") {
      updateData.lastError = lastError;
      updateData.attemptCount = task.attemptCount + 1;
    }

    const updated = await prisma.nFCProgrammingTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
