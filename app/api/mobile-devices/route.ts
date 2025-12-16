import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const getActiveUserSessions = async () => {
  const activeSessions = await prisma.session.findMany({
    where: { expires: { gt: new Date() } },
    select: { userId: true, expires: true },
  });

  const sessionMap = new Map<string, Date>();
  for (const session of activeSessions) {
    const existing = sessionMap.get(session.userId);
    // Keep the furthest expiry for visibility when multiple sessions exist
    if (!existing || existing < session.expires) {
      sessionMap.set(session.userId, session.expires);
    }
  }

  return sessionMap;
};

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

    const sessionMap = await getActiveUserSessions();

    const deviceWhereClause = user.role === "admin"
      ? {
          userId: {
            in: Array.from(sessionMap.keys()),
          },
        }
      : { userId: user.id };

    // If admin but no users are currently online, short circuit to avoid empty IN [] query
    if (user.role === "admin" && sessionMap.size === 0) {
      return NextResponse.json({ devices: [] });
    }

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
      isActive: device.isActive,
      lastHeartbeat: device.lastHeartbeat.toISOString(),
      user: {
        id: device.user.id,
        name: device.user.name,
        email: device.user.email,
      },
      hasActiveSession: sessionMap.has(device.userId),
      sessionExpiresAt: sessionMap.get(device.userId)?.toISOString() ?? null,
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
