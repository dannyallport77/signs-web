import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyMobileToken } from "@/lib/auth-mobile";

/**
 * POST /api/mobile-devices/register
 * Register a mobile device for remote NFC programming
 */
export async function POST(request: NextRequest) {
  try {
    // Supports both web dashboard (NextAuth cookie session) and mobile app (Bearer JWT)
    const session = await getServerSession(authOptions);
    const authHeader = request.headers.get("authorization");

    let user = null as null | { id: string; email: string };

    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = await verifyMobileToken(token);
      const userId = payload?.userId as string | undefined;
      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
