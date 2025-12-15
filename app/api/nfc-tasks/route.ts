import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/nfc-tasks/create
 * Create an NFC programming task to send to a mobile device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const {
      deviceId,
      businessId,
      promotionId,
      taskType,
      nfcData,
    } = await request.json();

    if (!deviceId || !businessId || !taskType || !nfcData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify device belongs to user
    const device = await prisma.mobileDevice.findUnique({
      where: { deviceId },
    });

    if (!device || device.userId !== user.id) {
      return NextResponse.json(
        { error: "Device not found or not authorized" },
        { status: 404 }
      );
    }

    // Create the task
    const task = await prisma.nFCProgrammingTask.create({
      data: {
        deviceId,
        businessId,
        promotionId,
        taskType,
        nfcData,
      },
    });

    return NextResponse.json({
      success: true,
      task,
      message: "NFC task created and sent to device",
    });
  } catch (error) {
    console.error("Error creating NFC task:", error);
    return NextResponse.json(
      { error: "Failed to create NFC task" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nfc-tasks
 * List NFC tasks for current user's business
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = request.nextUrl;
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");

    const whereClause: any = { businessId };
    if (status) whereClause.status = status;

    const tasks = await prisma.nFCProgrammingTask.findMany({
      where: whereClause,
      include: {
        device: {
          select: {
            deviceId: true,
            deviceName: true,
            osVersion: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
