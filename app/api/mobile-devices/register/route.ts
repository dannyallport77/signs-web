import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/mobile-devices/register
 * Register a mobile device for remote NFC programming
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

    const { deviceId, deviceName, appVersion, osVersion } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = await prisma.mobileDevice.findUnique({
      where: { deviceId },
    });

    if (existingDevice) {
      // Update existing device
      const updated = await prisma.mobileDevice.update({
        where: { deviceId },
        data: {
          deviceName,
          appVersion,
          osVersion,
          isActive: true,
          lastHeartbeat: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        device: updated,
        message: "Device updated",
      });
    }

    // Create new device
    const device = await prisma.mobileDevice.create({
      data: {
        deviceId,
        userId: user.id,
        deviceName,
        appVersion,
        osVersion,
      },
    });

    return NextResponse.json({
      success: true,
      device,
      message: "Device registered successfully",
    });
  } catch (error) {
    console.error("Device registration error:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}
