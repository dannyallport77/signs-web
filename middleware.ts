import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  
  // Allow all requests for now - auth will be handled by API routes
  // You can add cookie-based auth checking here later if needed
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
