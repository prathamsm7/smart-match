import { updateSession } from '@/lib/superbase/middleware'
import { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes (to prevent method conflicts)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)'
  ],
}
