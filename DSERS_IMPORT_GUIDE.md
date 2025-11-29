# DSers Product Import - Setup Guide

This guide explains how to import products from your DSers account into the Signs application.

## What is DSers?

DSers is a dropshipping platform that helps you find and import products from AliExpress and other suppliers. It's commonly used for managing product catalogs in e-commerce businesses.

## Important Note

**DSers does not provide a public API for direct integration.** Instead, this guide shows you how to import products using DSers' CSV export functionality.

## Setup Instructions

### 1. Export Products from DSers

1. Log in to your DSers account at [https://www.dsers.com/](https://www.dsers.com/)
2. Go to **My Products** or **Product List**
3. Click the **Export** button (usually at the top right)
4. Choose **Export to CSV**
5. Download the CSV file to your computer

### 2. Import Products via CSV

#### Option A: Using the Web Interface

1. Start your web development server (if not already running):
   ```bash
   cd signs-web
   npm run dev
   ```

2. Navigate to [http://localhost:3001/dsers-import-csv](http://localhost:3001/dsers-import-csv)

3. Click **Choose File** and select your DSers CSV export

4. Configure import options:
   - **Replace Existing**: Check this to delete all existing products before importing (use with caution!)

5. Click **Import Products from CSV**

6. Review the import results and click **View All Products** to see your imported products

#### Option B: Using the API Directly

Import products via CSV file upload:
```bash
curl -X POST http://localhost:3001/api/dsers/import-csv \
  -F "file=@/path/to/your/dsers-export.csv" \
  -F "replaceExisting=false"
```

Import products via JSON (with CSV data as string):
```bash
curl -X POST http://localhost:3001/api/dsers/import-csv \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": "product_id,title,price,description\n12345,For Sale Sign,29.99,High quality sign",
    "replaceExisting": false
  }'
```

## How It Works

1. **CSV Export**: You export your products from DSers as a CSV file
2. **File Upload**: Upload the CSV file through the web interface or API
3. **CSV Parsing**: The system parses the CSV and extracts product information
4. **Data Mapping**: CSV columns are mapped to your SignType database schema:
   - `product_id` / `id` / `sku` → `id` (prefixed with "dsers-")
   - `title` / `name` → `name`
   - `description` / `desc` → `description`
   - `price` / `cost` → `defaultPrice`
   - `image` / `image_url` → `imageUrl`
5. **Database Import**: Products are upserted (created or updated if they already exist)

## CSV Format Requirements

Your DSers CSV export should include at minimum:
- **Required columns**: `title` (or `name`) and `price`
- **Optional columns**: `product_id`, `description`, `image_url`, `sku`

### Sample CSV Format

```csv
product_id,title,price,description,image_url
12345,For Sale Sign,29.99,High quality for sale sign,https://example.com/image1.jpg
12346,To Let Sign,29.99,Professional to let sign,https://example.com/image2.jpg
12347,Sold Sign,29.99,Bold sold sign,https://example.com/image3.jpg
```

### Column Name Flexibility

The system recognizes various column names:
- **ID**: `product_id`, `id`, `sku`, `product id`
- **Title**: `title`, `name`, `product_name`, `product name`
- **Price**: `price`, `cost`, `amount`
- **Description**: `description`, `desc`, `details`
- **Image**: `image`, `image_url`, `imageurl`, `photo`, `picture`

The import process maps CSV data to your database schema which stores:
- ID (unique identifier, prefixed with "dsers-")
- Name
- Description
- Default Price
- Image URL
- Active status (always true for imported products)
- Created/Updated timestamps

## Troubleshooting

### "No file provided" or "Invalid CSV format"
- Make sure you're uploading a valid CSV file (not Excel .xlsx)
- Verify the CSV has a header row and at least one data row
- Check that the file isn't corrupted

### "CSV must contain at minimum: title/name and price columns"
- Your CSV must have columns named `title` (or `name`) and `price`
- Check the spelling of your column headers
- The system accepts various column name variations (see CSV Format Requirements section)

### "Invalid price" errors
- Make sure price values are numeric (e.g., `29.99` not `$29.99` or `29.99 USD`)
- Currency symbols will be automatically stripped, but ensure the base format is valid
- Avoid using commas as decimal separators

### Products not showing in mobile app
- Make sure the web server is running
- Check that `EXPO_PUBLIC_API_URL` in mobile app points to your web server (https://www.review-signs.co.uk/api)
- Verify products are marked as `isActive: true` in the database
- The mobile app fetches from `/api/mobile/products` endpoint

### Import partially failed
- Check the "Failed Imports" section in the results
- Common issues: missing required fields, invalid price format, database constraints
- You can fix the CSV and re-import (existing products will be updated, not duplicated)

## API Reference

### POST /api/dsers/import-csv
Import products from DSers CSV export.

**Method 1: File Upload (multipart/form-data)**

```bash
curl -X POST http://localhost:3001/api/dsers/import-csv \
  -F "file=@/path/to/dsers-export.csv" \
  -F "replaceExisting=false"
```

**Method 2: JSON with CSV string**

```bash
curl -X POST http://localhost:3001/api/dsers/import-csv \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": "product_id,title,price\n12345,Product Name,29.99",
    "replaceExisting": false
  }'
```

**Request Parameters:**
- `file` (File): CSV file to upload (when using multipart/form-data)
- `csvData` (string): CSV content as string (when using JSON)
- `replaceExisting` (boolean): Delete all existing products before importing (default: false)

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully imported 25 products from CSV",
  "data": {
    "imported": 25,
    "total": 25,
    "errors": 0,
    "products": [
      {
        "id": "dsers-12345",
        "name": "Product Name",
        "price": 29.99
      }
    ],
    "failedImports": []
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "CSV must contain at minimum: title/name and price columns",
  "foundHeaders": ["id", "description", "image"]
}
```

## Tips for Best Results

1. **Clean your CSV first**: Remove any special characters or formatting that might cause issues
2. **Test with a small file**: Try importing 5-10 products first to verify the format
3. **Check column names**: Make sure your CSV has `title` and `price` columns (case-insensitive)
4. **Use the web interface**: It provides better error feedback than the API
5. **Backup before replacing**: If using `replaceExisting`, make sure you have a backup of your existing products

## Batch Processing

For very large CSV files (1000+ products):
- Consider splitting into smaller batches (100-500 products each)
- Import one batch at a time to avoid timeouts
- The system will automatically handle duplicates (based on product_id)

## Support

For DSers-related questions:
- [DSers Help Center](https://help.dsers.com/)
- [DSers Community](https://www.facebook.com/groups/dsers)

For issues with this integration:
- Check the server logs for detailed error messages
- Verify your CSV format matches the requirements
- Contact your development team for technical support
