# Invoice Creation System

This document describes the invoice creation and email system implemented in the Review Signs application.

## Overview

The invoice system automatically generates invoices when a sale is recorded in the mobile app. Users can now:
1. Record sales with product quantities and prices
2. Provide customer name and email
3. Automatically generate and send PDF invoices via email
4. Retrieve invoice history by customer email

## Architecture

### Mobile App Flow

```
SaleCreationScreen
  ├─ Select products and quantities
  ├─ Set unit prices
  ├─ Click "Finalize" 
  └─ When "Send Invoice" is selected:
      ├─ Enter customer name and email
      └─ Invoke receiptService.sendReceipt()
          └─ POST to /api/mobile/invoices
```

### Backend Processing

```
POST /api/mobile/invoices
  ├─ Validate request (auth, email format, required fields)
  ├─ Generate unique invoice number (format: INV-{timestamp}-{random})
  ├─ Create Invoice record in database
  ├─ Create InvoiceItem records for each product
  ├─ Generate PDF using pdfkit
  ├─ Send email with PDF attachment using nodemailer
  ├─ Update invoice status to "sent"
  └─ Return invoiceNumber and invoiceId to client
```

## Database Schema

### Invoice Model
```prisma
model Invoice {
  id              String         @id @default(cuid())
  invoiceNumber   String         @unique
  customerEmail   String
  customerName    String
  businessId      String?
  totalAmount     Float
  status          String         @default("sent")
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  sentAt          DateTime       @default(now())
  items           InvoiceItem[]
}

model InvoiceItem {
  id              String    @id @default(cuid())
  invoiceId       String
  productId       String
  productName     String
  quantity        Int
  unitPrice       Float
  totalPrice      Float
  createdAt       DateTime  @default(now())
  invoice         Invoice   @relation(...)
}
```

## API Endpoints

### POST /api/mobile/invoices

Creates an invoice and sends it via email.

**Request:**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Smith",
  "items": [
    {
      "productId": "prod-1",
      "name": "A3 Sign",
      "quantity": 5,
      "unitPrice": 12.50,
      "totalPrice": 62.50
    }
  ],
  "totalAmount": 62.50,
  "notes": "Optional notes",
  "sendEmail": true
}
```

**Response (201):**
```json
{
  "success": true,
  "invoiceNumber": "INV-20251130-ABC12",
  "invoiceId": "cuid123...",
  "customerEmail": "customer@example.com",
  "message": "Invoice created successfully"
}
```

**Error Response (400/401/500):**
```json
{
  "error": "Error message describing what went wrong"
}
```

### GET /api/mobile/invoices

Retrieves invoices. Optionally filter by customer email.

**Query Parameters:**
- `email` (optional): Filter invoices by customer email

**Response:**
```json
{
  "success": true,
  "count": 5,
  "invoices": [
    {
      "id": "cuid123...",
      "invoiceNumber": "INV-20251130-ABC12",
      "customerEmail": "customer@example.com",
      "customerName": "John Smith",
      "totalAmount": 62.50,
      "status": "sent",
      "createdAt": "2025-11-30T10:30:00Z",
      "items": [
        {
          "productId": "prod-1",
          "productName": "A3 Sign",
          "quantity": 5,
          "unitPrice": 12.50,
          "totalPrice": 62.50
        }
      ]
    }
  ]
}
```

## Environment Variables

Configure these variables in `.env.local` for the backend:

```env
# Email Configuration (required for sending invoices)
EMAIL_HOST=smtp.gmail.com          # SMTP server host
EMAIL_PORT=587                      # SMTP port (typically 587 for TLS)
EMAIL_SECURE=false                  # true for port 465, false for 587
EMAIL_USER=your-email@gmail.com    # Email account
EMAIL_PASSWORD=your-app-password   # App-specific password (for Gmail)
EMAIL_FROM=invoices@review-signs.co.uk  # Sender email address
```

### Gmail Setup Example

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
3. Use this password as `EMAIL_PASSWORD` in `.env.local`

## PDF Invoice Format

The generated PDF includes:

- **Header**: Company logo/name (Review Signs)
- **Invoice Details**: Invoice number, date, customer name
- **Items Table**:
  - Product description
  - Quantity
  - Unit price
  - Total price per item
- **Total**: Grand total amount
- **Footer**: Thank you message

## Mobile App Integration

### SaleCreationScreen Updates

New UI elements:
- Customer name input field
- Customer email input field
- "Send Invoice" button with loading state
- Success confirmation showing invoice number

### receiptService Updates

New methods:
- `sendReceipt()`: Now creates invoices instead of temporary receipts
- `getInvoices()`: Retrieve invoices by customer email

### User Flow

1. User selects products and quantities
2. User clicks "Finalize"
3. User chooses "Yes" to send receipt
4. A receipt card appears with:
   - Customer name input
   - Customer email input
   - "Send Invoice" button
5. User enters customer info and clicks "Send Invoice"
6. Invoice is created, PDF is generated, and email is sent
7. Success message displays invoice number
8. Receipt card closes

## Error Handling

### Common Errors

**"Invalid email address"**
- Cause: Email format is incorrect
- Solution: Verify email follows standard format (user@domain.com)

**"Failed to create invoice"**
- Cause: Database error or Prisma issue
- Solution: Check database connection and schema migrations

**"Failed to send email"**
- Cause: Email configuration missing or incorrect
- Solution: Verify EMAIL_* environment variables are set correctly

### Graceful Degradation

If email sending fails:
- The invoice is still created and stored in database
- User receives error notification about email failure
- Invoice can be manually retrieved via API later

## Testing

### Test Invoice Creation
```bash
curl -X POST http://localhost:3000/api/mobile/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "items": [{
      "productId": "test-1",
      "name": "Test Product",
      "quantity": 2,
      "unitPrice": 10.00,
      "totalPrice": 20.00
    }],
    "totalAmount": 20.00
  }'
```

### Test Invoice Retrieval
```bash
curl http://localhost:3000/api/mobile/invoices?email=test@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Migration

To apply the invoice schema to an existing database:

```bash
npx prisma migrate dev --name add_invoices
```

This will:
1. Create the migration files
2. Apply changes to the database
3. Regenerate the Prisma Client

## Future Enhancements

- Invoice templating and branding
- Invoice status tracking (viewed, paid)
- Batch invoice generation
- Invoice export formats (CSV, Excel)
- Recurring invoices
- Payment integration (Stripe, PayPal)
- Invoice reminders
- Multi-currency support

## Dependencies

- **nodemailer**: ^6.x - Email sending
- **pdfkit**: ^0.13.x - PDF generation
- **@prisma/client**: ^6.x - Database ORM

## Support

For issues with invoice creation:
1. Check email configuration in `.env.local`
2. Verify database migrations have been run
3. Check server logs for detailed error messages
4. Ensure valid authentication token is provided
