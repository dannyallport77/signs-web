# AliExpress Product Import System - Backend Only

## Overview
AliExpress product importing is a **backend feature** meant for admins to manage your product catalog. This is NOT part of the mobile app - that's for customers to leave reviews.

## How It Works

### 1. Dashboard Import Page (`/dashboard/import`)
**Location:** Backend Admin Dashboard  
**Purpose:** Admins import products from AliExpress to save time

**Flow:**
1. Admin visits `/dashboard/import`
2. Pastes AliExpress product URL
3. Clicks "Fetch Product"
4. Backend scrapes:
   - Product title
   - Description
   - Price (cost)
   - Images (up to 10)
   - Video URL (if available)
   - Product options (Size, Color, etc.)
   - Specifications
5. Admin reviews scraped data and can edit:
   - Product title
   - Description
   - Cost price (what you pay)
   - Selling price (what customers pay)
   - Select which images to import
   - Category
6. Admin clicks "Import Product"
7. Product saved to database with:
   - All images
   - Video URL
   - Product options as variants
   - Specifications stored
   - AliExpress URL reference

### 2. Products Management Page (`/dashboard/products`)
**Location:** Backend Admin Dashboard  
**Purpose:** View and manage all imported products

**Features:**
- See all products in a table
- View cost price vs selling price
- Calculate profit margin automatically
- Toggle product active/inactive status
- Delete products
- Quick stats:
  - Total products count
  - Active products count
  - Overall profit margin %
- Click "View on AliExpress" to see original product

### 3. Backend API Endpoints

#### Scrape Product
**Endpoint:** `POST /api/aliexpress/scrape`
```json
{
  "url": "https://www.aliexpress.com/item/..."
}
```
**Returns:** Scraped product data (title, images, price, options, specs, video)

#### Import Product
**Endpoint:** `POST /api/products/import`
```json
{
  "title": "NFC Review Stand",
  "description": "Product description",
  "costPrice": 8.50,
  "sellingPrice": 25.00,
  "images": ["url1", "url2", ...],
  "videoUrl": "optional video URL",
  "aliexpressUrl": "original product URL",
  "category": "category name",
  "options": [
    { "name": "Color", "values": ["Black", "White"] }
  ],
  "specifications": [
    { "name": "Material", "value": "Acrylic" }
  ]
}
```
**Returns:** Created product with ID

#### List Products
**Endpoint:** `GET /api/products`
**Returns:** All products with full details

#### Delete Product
**Endpoint:** `DELETE /api/products/[id]`
**Returns:** Deleted product

#### Update Product
**Endpoint:** `PATCH /api/products/[id]`
**Returns:** Updated product

## Mobile App vs Backend Admin Dashboard

### Mobile App
- ✅ Displays imported products to customers
- ✅ Customers leave reviews via NFC tags
- ✅ Shows fruit machine promotions
- ❌ Does NOT import products
- ❌ Does NOT manage inventory
- ❌ Does NOT access AliExpress

### Backend Dashboard
- ✅ Imports products from AliExpress
- ✅ Manages product catalog
- ✅ Sets cost and selling prices
- ✅ Manages promotions
- ✅ Views analytics and sales
- ✅ Controls review menus

## Why Backend Only?

1. **Security:** AliExpress URLs and pricing should only be accessible to admins
2. **Performance:** Scraping is CPU-intensive, better on server
3. **Privacy:** Product costs are sensitive business data
4. **Simplicity:** Mobile app stays focused on customer review experience
5. **Scalability:** Can use advanced scraping services on backend

## Database Model

### Product Table
```
id: string (unique ID)
title: string
description: string
costPrice: float (what you pay)
sellingPrice: float (what customer pays)
images: string[] (array of image URLs)
videoUrl: string (optional video URL)
aliexpressUrl: string (reference to original)
category: string (product category)
isActive: boolean (shown to customers)
createdAt: date
updatedAt: date

options: ProductOption[] (Size, Color, etc.)
variants: ProductVariant[] (combinations of options)
```

### ProductOption Table
```
id: string
productId: string (foreign key)
name: string (e.g., "Color")
values: string[] (e.g., ["Black", "White", "Clear"])
```

### ProductVariant Table
```
id: string
productId: string (foreign key)
name: string (e.g., "Black - Large")
costPrice: float
sellingPrice: float
sku: string (optional)
inventory: int (stock count)
```

## Usage Workflow

### For Admins

1. **Find product on AliExpress**
   - Search for product you want to sell
   - Copy product URL

2. **Import into dashboard**
   - Go to `/dashboard/import`
   - Paste URL
   - Review scraped data
   - Adjust prices and title if needed
   - Select images
   - Click Import

3. **Manage products**
   - Go to `/dashboard/products`
   - See all products with profit margins
   - Enable/disable products
   - Delete products if needed

4. **Products available to customers**
   - Imported products appear in mobile app
   - Customers can browse and purchase
   - You can track sales

## Best Practices

### Pricing Strategy
- AliExpress typically 50-70% cheaper than selling price
- Suggested markup: 2.5x-3.5x cost price
- Dashboard calculates margin automatically
- Consider shipping costs in your profit margin

### Image Selection
- Select 3-5 best images
- Include product from different angles
- Include lifestyle/context images
- Don't select all 20+ images (slow loading)

### Product Details
- Edit title if AliExpress title is too generic
- Fill in description with your own words
- Use proper category for filtering
- Keep descriptions clear and professional

### Inventory Management
- Track actual stock in ProductVariant
- Update when you receive new shipment
- Monitor inventory in dashboard
- Set low stock alerts (planned feature)

## Troubleshooting

### Scraping fails
- Check that URL is valid AliExpress link
- Some products may have anti-scraping measures
- Try copying URL directly from browser address bar
- Check server logs for detailed error

### Images not loading
- Some AliExpress images may have CORS issues
- Try using different image from the list
- Image URLs expire after time - re-import if needed

### Price calculation wrong
- Make sure costPrice < sellingPrice
- Don't include currency symbols, just numbers
- Dashboard calculates margin: (selling - cost) / cost * 100

## Future Enhancements

Potential features to add:
- Bulk import (CSV file upload)
- Automatic price calculation based on markup %
- Inventory tracking and low stock alerts
- Supplier integration (auto-updates when AliExpress price changes)
- Barcode generation and scanning
- SKU auto-generation
- Variant pricing tiers
