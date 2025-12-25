import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'db');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  try {
    const filePath = path.join(BACKUP_DIR, filename);

    // Security check
    if (!filePath.startsWith(BACKUP_DIR)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return NextResponse.json({ success: true, message: 'Backup deleted' });
    } else {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  try {
    const filePath = path.join(BACKUP_DIR, filename);

    // Security check
    if (!filePath.startsWith(BACKUP_DIR)) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
