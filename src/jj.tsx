// middleware.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";

// ⏱️ CONFIGURATION DE SÉCURITÉ
const SECURITY_CONFIG = {
  SESSION_MAX_AGE: 8 * 60 * 60 * 1000,
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,
  REQUIRE_REAUTH_ON_BROWSER_CLOSE: true,
  VALIDATE_IP_ADDRESS: true,
  VALIDATE_USER_AGENT: true,
  JWT_SECRET: process.env.JWT_SECRET || "votre-secret-super-securise",
} as const;

// 🔐 Types pour la validation de session
interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId: string;
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  shouldReauth: boolean;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const currentTime = Date.now();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // ✅ Chemins publics
  const publicPaths = ["/", "/api/auth", "/connexion", "/inscription"];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublicPath) {
    return response;
  }

  // 🔒 VALIDATION STRICTE DE LA SESSION
  const validationResult = await validateSecureSession(
    request,
    supabase,
    currentTime
  );

  // ❌ Session invalide → FORCER LA RECONNEXION
  if (!validationResult.isValid || validationResult.shouldReauth) {
    console.log(`❌ ACCÈS REFUSÉ: ${validationResult.reason}`);

    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set(
      "reason",
      validationResult.reason || "session_invalid"
    );

    const redirectResponse = NextResponse.redirect(loginUrl);
    cleanAllSessionCookies(redirectResponse);

    return redirectResponse;
  }

  // ✅ Session valide → Mettre à jour l'activité
  await updateSessionActivity(request, response, currentTime);

  return response;
}

// 🔍 FONCTION: Validation sécurisée de la session
async function validateSecureSession(
  request: NextRequest,
  supabase: any,
  currentTime: number
): Promise<ValidationResult> {
  // 1️⃣ VÉRIFIER LES SESSIONS COOKIES (Super Admin et Utilisateur)
  const superAdminCookie = request.cookies.get("superadmin_session");
  const userCookie = request.cookies.get("user_session");

  // 🔐 VALIDATION SUPER ADMIN AVEC JWT
  if (superAdminCookie) {
    const superAdminValidation = await validateSuperAdminSession(
      superAdminCookie.value,
      request,
      currentTime
    );

    if (superAdminValidation.isValid) {
      return superAdminValidation;
    }
  }

  // 👤 VALIDATION UTILISATEUR NORMAL SUPABASE
  if (userCookie) {
    const userValidation = await validateUserSession(
      userCookie.value,
      supabase,
      request,
      currentTime
    );

    if (userValidation.isValid) {
      return userValidation;
    }
  }

  // ❌ AUCUNE SESSION VALIDE
  return {
    isValid: false,
    reason: "no_valid_session",
    shouldReauth: true,
  };
}

// 🔐 FONCTION: Valider session Super Admin avec JWT
async function validateSuperAdminSession(
  cookieValue: string,
  request: NextRequest,
  currentTime: number
): Promise<ValidationResult> {
  try {
    const sessionData = JSON.parse(cookieValue);

    // Vérifier la structure de base
    if (!sessionData.id || !sessionData.email || !sessionData.session_token) {
      return {
        isValid: false,
        reason: "invalid_superadmin_session",
        shouldReauth: true,
      };
    }

    // 🔒 VALIDATION JWT DU TOKEN DE SESSION
    try {
      const secret = new TextEncoder().encode(SECURITY_CONFIG.JWT_SECRET);
      const { payload } = await jwtVerify(sessionData.session_token, secret);

      // Vérifier l'expiration
      if (payload.exp && currentTime >= payload.exp * 1000) {
        return {
          isValid: false,
          reason: "superadmin_token_expired",
          shouldReauth: true,
        };
      }
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      return {
        isValid: false,
        reason: "invalid_superadmin_token",
        shouldReauth: true,
      };
    }

    // Vérifier l'inactivité
    const inactivityTime = currentTime - sessionData.lastActivity;
    if (inactivityTime > SECURITY_CONFIG.INACTIVITY_TIMEOUT) {
      return {
        isValid: false,
        reason: "superadmin_inactivity",
        shouldReauth: true,
      };
    }

    console.log(`✅ Super Admin session valid: ${sessionData.email}`);

    return {
      isValid: true,
      shouldReauth: false,
    };
  } catch (error) {
    return {
      isValid: false,
      reason: "corrupted_superadmin_session",
      shouldReauth: true,
    };
  }
}

// 👤 FONCTION: Valider session utilisateur normal
async function validateUserSession(
  cookieValue: string,
  supabase: any,
  request: NextRequest,
  currentTime: number
): Promise<ValidationResult> {
  try {
    const sessionData = JSON.parse(cookieValue);

    // 1. Vérifier l'authentification Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        isValid: false,
        reason: "no_supabase_auth",
        shouldReauth: true,
      };
    }

    // 2. Vérifier la correspondance utilisateur
    if (sessionData.id !== user.id) {
      return {
        isValid: false,
        reason: "user_mismatch",
        shouldReauth: true,
      };
    }

    // 3. Vérifier la session Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        isValid: false,
        reason: "no_active_session",
        shouldReauth: true,
      };
    }

    // 4. Vérifier l'expiration du token
    const tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    if (tokenExpiresAt > 0 && currentTime >= tokenExpiresAt) {
      return {
        isValid: false,
        reason: "token_expired",
        shouldReauth: true,
      };
    }

    // 5. Vérifier l'inactivité
    const inactivityTime = currentTime - sessionData.lastActivity;
    if (inactivityTime > SECURITY_CONFIG.INACTIVITY_TIMEOUT) {
      return {
        isValid: false,
        reason: "inactivity_timeout",
        shouldReauth: true,
      };
    }

    console.log(`✅ User session valid: ${user.email}`);

    return {
      isValid: true,
      shouldReauth: false,
    };
  } catch (error) {
    return {
      isValid: false,
      reason: "corrupted_user_session",
      shouldReauth: true,
    };
  }
}

// 🔄 FONCTION: Mettre à jour l'activité de la session
async function updateSessionActivity(
  request: NextRequest,
  response: NextResponse,
  currentTime: number
): Promise<void> {
  // Mettre à jour Super Admin session
  const superAdminCookie = request.cookies.get("superadmin_session");
  if (superAdminCookie) {
    try {
      const sessionData = JSON.parse(superAdminCookie.value);
      sessionData.lastActivity = currentTime;

      response.cookies.set("superadmin_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 heures
        path: "/",
      });
    } catch (error) {
      console.error("Erreur mise à jour Super Admin:", error);
    }
  }

  // Mettre à jour User session
  const userCookie = request.cookies.get("user_session");
  if (userCookie) {
    try {
      const sessionData = JSON.parse(userCookie.value);
      sessionData.lastActivity = currentTime;

      response.cookies.set("user_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 8 * 60 * 60, // 8 heures
        path: "/",
      });
    } catch (error) {
      console.error("Erreur mise à jour User:", error);
    }
  }
}

// 🧹 FONCTION: Nettoyer tous les cookies de session
function cleanAllSessionCookies(response: NextResponse): void {
  const cookiesToClean = [
    "superadmin_session",
    "user_session",
    "sigep_secure_session",
    "sigep_browser_session",
    "sb-access-token",
    "sb-refresh-token",
  ];

  cookiesToClean.forEach((cookieName) => {
    response.cookies.delete(cookieName);
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
