# Backup & Recovery System

## Overview

Your Signs App now has **two backup systems** protecting your code:

### 1. **GitHub Actions Daily Backups** (Cloud)
- Runs daily at 2 AM automatically
- Creates timestamped backup branches on GitHub
- Keeps 24-day rolling window of backups
- **Free** (uses GitHub Actions quota)
- Accessible from any machine with GitHub access

### 2. **macOS LaunchAgent Daily Backups** (Local)
- Runs daily at 2 AM automatically on your Mac
- Stores compressed backups locally (~670MB per backup)
- Keeps last 24 backups (24 days of history)
- Fast local restore (no internet needed)
- Can restore quickly if needed

## Quick Commands

### Check backup status
```bash
/Users/admin/Development/backup_manage.sh status
```

### List all available backups
```bash
/Users/admin/Development/backup_manage.sh list
```

### Restore from a backup
```bash
/Users/admin/Development/backup_manage.sh restore signs-app-backup-2025-11-25_14-55-39.tar.gz
```

### Disable/Enable hourly backups
```bash
/Users/admin/Development/backup_manage.sh disable
/Users/admin/Development/backup_manage.sh enable
```

## Backup Locations

| Type | Location | Retention | Access |
|------|----------|-----------|--------|
| **Local** | `~/.signs_app_backups/` | Last 24 hours | Mac only |
| **GitHub** | GitHub backup branches | Last 24 hours | Anywhere with GitHub |
| **Manual** | Your choice | As long as you keep | Anywhere |

## Understanding Your Backup System

### When Backups Run
- **Local backups**: Daily at 2 AM
- **GitHub backups**: Daily at 2 AM

### What Gets Backed Up
- Full `signs-app/` directory with all source code and configuration
- **EXCLUDES** (auto-regenerated):
  - `node_modules/` - reinstalled via npm install
  - `.next/`, `.expo/`, `build/`, `dist/` - build artifacts
  - `*.log`, `*.ipa` - logs and build files
  - `.env*` - environment variables (use .env.example instead)
  - `.DS_Store`, `.vercel` - OS and deployment cache

### Backup Size
- Each backup: ~11MB (compressed source code only)
- Local storage: 24 × 11MB = ~264MB maximum
- Auto-cleanup: Oldest backups deleted when limit reached

### How to Recover

#### Option 1: Quick Local Restore
If you accidentally deleted or broke something locally:
```bash
/Users/admin/Development/backup_manage.sh list
/Users/admin/Development/backup_manage.sh restore [backup-filename]

# After restore, reinstall dependencies:
cd signs-web && npm install
cd ../signs-mobile && npm install
```

#### Option 2: GitHub Browser Restore
Go to https://github.com/yourusername/signs-app and browse the backup branches:
- Branch naming: `backup-YYYY-MM-DD-HH-MM-SS`
- Click "Code" button, download as ZIP
- Extract and copy files back

#### Option 3: Git Clone from Backup Branch
```bash
git clone --branch backup-2025-11-25-14-00-00 https://github.com/yourusername/signs-app.git
```

## Important Notes

⚠️ **These backups are your safety net:**
- Don't rely on them as your primary version control
- Always push important commits to master branch
- GitHub Actions backups require a valid GitHub connection
- Local backups work offline

✅ **Best Practices:**
- Keep both backup systems active
- Check `backup_manage.sh status` occasionally
- Test a restore if you're concerned about recovery
- Document important commits in your code

## Troubleshooting

### Backups not running?
```bash
# Check if LaunchAgent is loaded
launchctl list | grep signsapp

# Re-enable if needed
/Users/admin/Development/backup_manage.sh enable
```

### Check backup logs
```bash
cat /Users/admin/.signs_app_backups/backup.log
cat /Users/admin/.signs_app_backups/backup-error.log
```

### Disk space issues?
```bash
# Check current size
du -sh /Users/admin/.signs_app_backups/

# Manual cleanup of old backups
ls -t /Users/admin/.signs_app_backups/signs-app-backup-*.tar.gz | tail -n +10 | xargs rm
```

### Test a restore
```bash
# Create a test directory
mkdir -p /tmp/restore-test
cd /tmp/restore-test

# Extract latest backup
tar -xzf /Users/admin/.signs_app_backups/signs-app-backup-*.tar.gz | head -1 | xargs -I {} tar -xzf {}

# Verify key files exist
ls signs-app/signs-web/app/products/page.tsx  # Should exist
```

## Summary

You're now protected with:
- ✅ Daily local backups (fast, offline)
- ✅ Daily GitHub backups (cloud, accessible anywhere)
- ✅ 24-day rolling recovery window
- ✅ Automated management scripts
- ✅ Zero-cost backup infrastructure

**Your code is safe!**
