import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/analyze',
  '/results',
  '/cv-optimizer',
  '/cover-letter',
  '/interview',
  '/profile'
]

const authRoutes = ['/login', '/register']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  const isProtected = protectedRoutes.some(
    route => pathname.startsWith(route)
  )

  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  const isAuthRoute = authRoutes.some(
    route => pathname.startsWith(route)
  )

  if (isAuthRoute && token) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}