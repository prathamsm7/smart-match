import { updateSession } from '@/lib/superbase/middleware'
import { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
