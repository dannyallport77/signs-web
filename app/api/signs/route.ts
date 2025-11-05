import { NextResponse } from 'next/server';

export async function GET() {
  const signs = [
    { id: 1, name: 'Exit Sign', type: 'safety', status: 'active' },
    { id: 2, name: 'Fire Extinguisher', type: 'safety', status: 'active' },
    { id: 3, name: 'No Smoking', type: 'warning', status: 'active' },
    { id: 4, name: 'Emergency Exit', type: 'safety', status: 'active' },
  ];

  return NextResponse.json({
    success: true,
    data: signs,
    count: signs.length,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate the request
  if (!body.name || !body.type) {
    return NextResponse.json(
      { success: false, error: 'Name and type are required' },
      { status: 400 }
    );
  }

  // Simulate creating a new sign
  const newSign = {
    id: Date.now(),
    name: body.name,
    type: body.type,
    status: body.status || 'active',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    data: newSign,
  }, { status: 201 });
}
