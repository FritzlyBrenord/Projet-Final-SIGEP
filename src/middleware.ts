// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║           🔍 MIDDLEWARE ACTIVÉ                        ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("📄 Page demandée:", pathname);
  console.log("");

  // ✅ Chemins publics
  const publicPaths = ['/login', '/api'];
  const isRootPath = pathname === '/';
  const isPublicPath = publicPaths.some(path => {
    if (path === pathname) return true;
    if (pathname.startsWith(path + '/')) return true;
    return false;
  });

  if (isRootPath || isPublicPath) {
    console.log("✅ CHEMIN PUBLIC → Pas de vérification de cookies");
    console.log("═══════════════════════════════════════════════════════\n");
    return NextResponse.next();
  }

 
  // Récupérer TOUS les cookies
  const allCookies = request.cookies.getAll();
  
  console.log("\n📋 TOUS LES COOKIES PRÉSENTS:");
  console.log("───────────────────────────────────────────────────────");
  if (allCookies.length === 0) {
    console.log("   ❌ AUCUN COOKIE TROUVÉ !");
  } else {
    console.log(`   ✅ ${allCookies.length} cookie(s) détecté(s):\n`);
    allCookies.forEach((cookie, index) => {
      console.log(`   [${index + 1}] Nom: ${cookie.name}`);
      console.log(`       Valeur: ${cookie.value.substring(0, 100)}${cookie.value.length > 100 ? '...' : ''}`);
      console.log("");
    });
  }

  // Vérifier les cookies spécifiques
  console.log("\n🔍 COOKIES DE SESSION RECHERCHÉS:");
  console.log("───────────────────────────────────────────────────────");

  const superAdminCookie = request.cookies.get('superadmin_session');
  const userCookie = request.cookies.get('user_session');

  // Super Admin Cookie
  console.log("\n1️⃣  Cookie: superadmin_session");
  if (superAdminCookie) {
   
    try {
      const parsed = JSON.parse(superAdminCookie.value);
     
    } catch (e) {
      console.log("   ⚠️  ERREUR: Impossible de décoder le JSON");
    }
  } else {
    console.log("   ❌ ❌ ❌ N'EXISTE PAS ! ❌ ❌ ❌");
  }

  // User Cookie
  console.log("\n2️⃣  Cookie: user_session");
  if (userCookie) {
    
    try {
      const parsed = JSON.parse(userCookie.value);
      
    } catch (e) {
      console.log("   ⚠️  ERREUR: Impossible de décoder le JSON");
    }
  } else {
    console.log("   ❌ ❌ ❌ N'EXISTE PAS ! ❌ ❌ ❌");
  }

  // Résumé
 
  // ❌ Aucun cookie trouvé
  if (!superAdminCookie && !userCookie) {
  
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('reason', 'browser_closed');
    return NextResponse.redirect(loginUrl);
  }

  // Validation Super Admin
  if (superAdminCookie) {
    console.log("🔐 Validation du cookie Super Admin en cours...\n");
    try {
      const sessionData = JSON.parse(superAdminCookie.value);

      if (!sessionData.email || !sessionData.role || !sessionData.timestamp) {
        console.log("❌ Cookie invalide (données manquantes)");
        console.log("🔄 Redirection + suppression du cookie\n");
        
        const response = NextResponse.redirect(new URL('/?reason=security_error', request.url));
        response.cookies.delete('superadmin_session');
        return response;
      }

      const sessionAge = Date.now() - new Date(sessionData.timestamp).getTime();
      const MAX_SESSION_AGE = 8 * 60 * 60 * 1000;
      const ageInMinutes = Math.floor(sessionAge / 60000);

      console.log("⏱️  Âge de la session:", ageInMinutes, "minutes");

      if (sessionAge > MAX_SESSION_AGE) {
        console.log("❌ Session expirée (> 8 heures)");
        console.log("🔄 Redirection + suppression du cookie\n");
        
        const response = NextResponse.redirect(new URL('/?reason=session_expired', request.url));
        response.cookies.delete('superadmin_session');
        return response;
      }

     
      return NextResponse.next();

    } catch (error) {
      console.log("❌ ERREUR lors du parsing du cookie");
      console.log("🔄 Redirection + suppression du cookie\n");
      
      const response = NextResponse.redirect(new URL('/?reason=security_error', request.url));
      response.cookies.delete('superadmin_session');
      return response;
    }
  }

  // Validation Utilisateur
  if (userCookie) {
    console.log("👤 Validation du cookie Utilisateur en cours...\n");
    try {
      const sessionData = JSON.parse(userCookie.value);

      if (!sessionData.email || !sessionData.id || !sessionData.timestamp) {
        console.log("❌ Cookie invalide (données manquantes)");
        console.log("🔄 Redirection + suppression du cookie\n");
        
        const response = NextResponse.redirect(new URL('/?reason=security_error', request.url));
        response.cookies.delete('user_session');
        return response;
      }

      const sessionAge = Date.now() - new Date(sessionData.timestamp).getTime();
      const MAX_SESSION_AGE = 8 * 60 * 60 * 1000;
      const ageInMinutes = Math.floor(sessionAge / 60000);

      console.log("⏱️  Âge de la session:", ageInMinutes, "minutes");

      if (sessionAge > MAX_SESSION_AGE) {
        console.log("❌ Session expirée (> 8 heures)");
        console.log("🔄 Redirection + suppression du cookie\n");
        
        const response = NextResponse.redirect(new URL('/?reason=session_expired', request.url));
        response.cookies.delete('user_session');
        return response;
      }

     
      return NextResponse.next();

    } catch (error) {
      console.log("❌ ERREUR lors du parsing du cookie");
      console.log("🔄 Redirection + suppression du cookie\n");
      
      const response = NextResponse.redirect(new URL('/?reason=security_error', request.url));
      response.cookies.delete('user_session');
      return response;
    }
  }

  console.log("❌ ERREUR INATTENDUE - Redirection\n");
  return NextResponse.redirect(new URL('/?reason=security_error', request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
