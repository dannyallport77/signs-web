import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/mobile-devices/[deviceId]/tasks
 * Poll for pending NFC programming tasks for a device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId: deviceUuid } = await params;

    if (!deviceUuid) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Verify device exists and update lastHeartbeat
    const device = await prisma.mobileDevice.findUnique({
      where: { deviceId: deviceUuid },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Update device heartbeat to track activity
    await prisma.mobileDevice.update({
      where: { deviceId: deviceUuid },
      data: { lastHeartbeat: new Date() },
    });

    // Get pending tasks for this device
    const tasks = await prisma.nFCProgrammingTask.findMany({
      where: {
        deviceId: device.id,
        status: { in: ["pending", "acknowledged"] },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`[PassiveNFC] Device ${deviceUuid} polled - found ${tasks.length} tasks`);

    return NextResponse.json({ tasks, deviceId: deviceUuid });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mobile-devices/[deviceId]/tasks?taskId=...
 * Update task status (acknowledge, writing, completed, failed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId: deviceUuid } = await params;
    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { status, lastError } = await request.json();

    const validStatuses = ["acknowledged", "writing", "completed", "failed"] as const;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid task status" },
        { status: 400 }
      );
    }

    const device = await prisma.mobileDevice.findUnique({
      where: { deviceId: deviceUuid },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const task = await prisma.nFCProgrammingTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deviceId !== device.id) {
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

    // Also update device heartbeat to track activity
    await prisma.mobileDevice.update({
      where: { deviceId: deviceUuid },
      data: { lastHeartbeat: new Date() },
    });

    console.log(`[PassiveNFC] Task ${taskId} status updated to ${status}`);

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
