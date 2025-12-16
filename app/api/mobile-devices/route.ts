import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/mobile-devices
 * List all devices for logged-in user
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

    const configuredTimeout = parseInt(process.env.NEXT_PUBLIC_NFC_DEVICE_TIMEOUT_MINUTES || "10", 10);
    const heartbeatThresholdMinutes = Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 10;
    const heartbeatThreshold = new Date(Date.now() - heartbeatThresholdMinutes * 60 * 1000);

    const deviceWhereClause = user.role === "admin"
      ? {
          lastHeartbeat: {
            gt: heartbeatThreshold,
          },
        }
      : {
          userId: user.id,
          lastHeartbeat: {
            gt: heartbeatThreshold,
          },
        };

    const devices = await prisma.mobileDevice.findMany({
      where: deviceWhereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { lastHeartbeat: "desc" },
    });

    const serializedDevices = devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      osVersion: device.osVersion,
      isActive: device.lastHeartbeat > heartbeatThreshold,
      lastHeartbeat: device.lastHeartbeat.toISOString(),
      user: {
        id: device.user.id,
        name: device.user.name,
        email: device.user.email,
      },
      heartbeatThresholdMinutes,
    }));

    return NextResponse.json({ devices: serializedDevices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
