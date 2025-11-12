import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Vérifier seulement les routes protégées
  if (request.nextUrl.pathname.startsWith('/SIGEP-Tableau-De-Bord')) {
    const uuidCookie = request.cookies.get('client_uuid');
    
    // Si pas d'UUID cookie, rediriger vers la racine
    if (!uuidCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/SIGEP-Tableau-De-Bord/:path*',
};