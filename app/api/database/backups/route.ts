import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/admin';

const execFileAsync = promisify(execFile);
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'db');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response;
  }

  try {
    const files = await fs.promises.readdir(BACKUP_DIR);
    
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.dump'))
        .map(async (file) => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
    );

    // Sort by newest first
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.dump`;
    const filePath = path.join(BACKUP_DIR, filename);
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Use pg_dump with custom format (-F c) which is compressed and suitable for pg_restore
    await execFileAsync('pg_dump', [databaseUrl, '-F', 'c', '-f', filePath]);

    return NextResponse.json({ 
      success: true, 
      message: 'Backup created successfully',
      backup: {
        name: filename,
        createdAt: new Date(),
      }
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create backup' },
      { status: 500 }
    );
  }
}
