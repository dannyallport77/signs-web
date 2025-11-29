# DSers CSV Import - Quick Start

## ✅ Solution Implemented

Since **DSers doesn't provide a public API**, I've created a **CSV import system** instead. This is the standard way to import products from DSers.

## 🚀 How to Use

### Step 1: Export from DSers
1. Go to [dsers.com](https://www.dsers.com/) and log in
2. Navigate to **My Products**
3. Click **Export** → **Export to CSV**
4. Download the CSV file

### Step 2: Import to Signs App

**Option A: Web Interface (Recommended)**
1. Go to: http://localhost:3001/dsers-import-csv
2. Upload your CSV file
3. Click "Import Products from CSV"
4. Done! ✓

**Option B: Command Line**
```bash
curl -X POST http://localhost:3001/api/dsers/import-csv \
  -F "file=@/path/to/your-dsers-export.csv"
```

## 📋 CSV Requirements

Your CSV must have these columns:
- **Required**: `title` (or `name`) and `price`
- **Optional**: `product_id`, `description`, `image_url`

## ✅ Already Tested!

I've included a sample CSV file and already imported 10 products successfully:
- For Sale Sign ($29.99)
- To Let Sign ($29.99)
- Sold Sign ($29.99)
- Under Offer Sign ($29.99)
- Private Parking Sign ($19.99)
- Open House Sign ($24.99)
- A-Board Sign ($39.99)
- Business Card ($9.99)
- Menu Board ($49.99)
- Welcome Sign ($34.99)

Check them at: http://localhost:3001/products

## 📚 Full Documentation

See [DSERS_IMPORT_GUIDE.md](./DSERS_IMPORT_GUIDE.md) for complete instructions, troubleshooting, and API reference.

## 🎯 Key Features

✅ Import unlimited products from DSers CSV exports  
✅ Automatic column detection (flexible column names)  
✅ Update existing products (no duplicates)  
✅ Optional: Replace all existing products  
✅ Detailed error reporting  
✅ Works with both web and mobile apps  

## 🔗 Files Created

- `/app/api/dsers/import-csv/route.ts` - API endpoint
- `/app/dsers-import-csv/page.tsx` - Web interface
- `/lib/dsers.ts` - Service file (with notes about API limitations)
- `DSERS_IMPORT_GUIDE.md` - Complete documentation
- `sample-dsers-import.csv` - Sample CSV for testing
