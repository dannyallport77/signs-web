import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'db');

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Security check: prevent directory traversal
    if (!filePath.startsWith(BACKUP_DIR)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Use pg_restore
    // --clean: drop database objects before creating them
    // --if-exists: used with --clean
    // --no-owner --no-privileges: avoid permission issues
    // -d: database to connect to
    const command = `pg_restore --clean --if-exists --no-owner --no-privileges -d "${databaseUrl}" "${filePath}"`;

    await execAsync(command);

    return NextResponse.json({ 
      success: true, 
      message: 'Database restored successfully' 
    });

  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore database' },
      { status: 500 }
    );
  }
}
