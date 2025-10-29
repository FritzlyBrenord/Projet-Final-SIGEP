import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value ?? null
        },
        set(name, value, options) {
          response.cookies.set(name, value, options)
        },
        remove(name, options) {
          response.cookies.delete(name, options)
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Page de login = accès libre
  if (path === '/' || path === '/test') return response

  // VÉRIFIER LA SESSION SUPER ADMIN (cookie)
  const superAdminSession = request.cookies.get('superadmin_session')?.value
  if (superAdminSession) {
    try {
      const sessionData = JSON.parse(superAdminSession)
      const sessionTime = new Date(sessionData.timestamp)
      const now = new Date()
      const hoursDiff = (now - sessionTime) / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        // Session superAdmin valide - accès autorisé
        return response
      } else {
        // Session expirée - supprimer le cookie
        response.cookies.delete('superadmin_session')
      }
    } catch (error) {
      // Cookie invalide - le supprimer
      response.cookies.delete('superadmin_session')
    }
  }

  // VÉRIFIER LE COOKIE UUID
  const clientUuid = request.cookies.get('client_uuid')?.value
  if (!clientUuid) {
    // Pas de UUID - rediriger vers login
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Vérifier si l'utilisateur est connecté
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Vérifier si le compte est bloqué
  const { data: userProfile } = await supabase
    .from('Utilisateur')
    .select('id, isbloquer')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.isbloquer) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}