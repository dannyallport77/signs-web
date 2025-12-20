import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customer-sites?placeId=XXX
 * Check if customer details exist for a site
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    const customerSite = await prisma.customerSite.findUnique({
      where: { placeId },
    });

    if (customerSite) {
      return NextResponse.json({
        exists: true,
        data: {
          id: customerSite.id,
          placeId: customerSite.placeId,
          businessName: customerSite.businessName,
          customerName: customerSite.customerName,
          customerEmail: customerSite.customerEmail,
          customerPhone: customerSite.customerPhone,
        },
      });
    }

    return NextResponse.json({
      exists: false,
      data: null,
    });
  } catch (error) {
    console.error('Error checking customer site:', error);
    return NextResponse.json(
      { error: 'Failed to check customer site' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer-sites
 * Create customer details for a new site
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      placeId,
      businessName,
      businessAddress,
      customerName,
      customerEmail,
      customerPhone,
      createdBy,
    } = body;

    if (!placeId || !businessName || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'placeId, businessName, customerName, customerEmail, and customerPhone are required' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.customerSite.findUnique({
      where: { placeId },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.customerSite.update({
        where: { placeId },
        data: {
          businessName,
          businessAddress,
          customerName,
          customerEmail,
          customerPhone,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        updated: true,
      });
    }

    // Create new record
    const customerSite = await prisma.customerSite.create({
      data: {
        placeId,
        businessName,
        businessAddress,
        customerName,
        customerEmail,
        customerPhone,
        createdBy,
      },
    });

    console.log(`[CustomerSite] Created for ${businessName} (${placeId})`);

    return NextResponse.json({
      success: true,
      data: customerSite,
      created: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer site:', error);
    return NextResponse.json(
      { error: 'Failed to create customer site' },
      { status: 500 }
    );
  }
}
