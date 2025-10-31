// src/hooks/useOnlinePresence.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContextUtilisateur } from '@/Context/ContextUtilisateur';

interface UseOnlinePresenceProps {
  inactivityTimeout?: number; // 30 minutes par défaut
}

export function useOnlinePresence({
  inactivityTimeout = 30 * 60 * 1000, // 30 minutes
}: UseOnlinePresenceProps = {}) {
  const router = useRouter();
  const { Logout } = useContextUtilisateur();
  
  const [isOnline, setIsOnline] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Récupérer les données de session depuis les cookies
  const getSessionData = () => {
    const cookies = document.cookie.split(';');
    
    // Chercher superadmin_session
    const superAdminCookie = cookies.find(c => c.trim().startsWith('superadmin_session='));
    if (superAdminCookie) {
      try {
        const value = superAdminCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        console.error('Erreur parsing superadmin cookie:', e);
      }
    }
    
    // Chercher user_session
    const userCookie = cookies.find(c => c.trim().startsWith('user_session='));
    if (userCookie) {
      try {
        const value = userCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        console.error('Erreur parsing user cookie:', e);
      }
    }
    
    return null;
  };

  // Marquer comme connecté dans la base de données
  const markAsOnline = useCallback(async () => {
    const sessionData = getSessionData();
    if (!sessionData) return;

    try {
      await fetch('/api/presence/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: sessionData.id,
          email: sessionData.email,
          session_token: sessionData.session_token,
        }),
      });
      
      setIsOnline(true);
      console.log('🟢 Marqué comme ONLINE dans la BD');
    } catch (error) {
      console.error('Erreur markAsOnline:', error);
    }
  },[]);

  // Marquer comme déconnecté dans la base de données
  const markAsOffline = useCallback(async () => {
    const sessionData = getSessionData();
    if (!sessionData) return;

    try {
      await fetch('/api/presence/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: sessionData.id,
          email: sessionData.email,
          session_token: sessionData.session_token,
        }),
      });
      
      setIsOnline(false);
      console.log('⚫ Marqué comme OFFLINE dans la BD');
    } catch (error) {
      console.error('Erreur markAsOffline:', error);
    }
  },[]);

  // Envoyer un heartbeat (ping)
  const sendHeartbeat = useCallback(async () => {
    const sessionData = getSessionData();
    if (!sessionData) {
      console.log('❌ Pas de session - Arrêt heartbeat');
      stopHeartbeat();
      return;
    }

    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: sessionData.id,
          email: sessionData.email,
          session_token: sessionData.session_token,
        }),
      });

      if (response.ok) {
        console.log('💓 Heartbeat envoyé');
      } else {
        console.error('❌ Erreur heartbeat:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur heartbeat:', error);
    }
  },[]);

  // Démarrer le heartbeat (toutes les 30 secondes)
  const startHeartbeat = useCallback (() => {
    if (heartbeatIntervalRef.current) return;

    // Premier heartbeat immédiat
    sendHeartbeat();

    // Puis toutes les 30 secondes
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 secondes

    console.log('💓 Heartbeat démarré (30s)');
  },[sendHeartbeat]);

  // Arrêter le heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('💓 Heartbeat arrêté');
    }
  };

  // Déconnexion automatique après inactivité
  const performAutoLogout = useCallback(async () => {
    console.log('⏰ DÉCONNEXION AUTOMATIQUE - 30 min d\'inactivité');
    
    // Marquer comme offline
    await markAsOffline();
    
    // Arrêter heartbeat
    stopHeartbeat();
    
    // Nettoyer timers
    clearAllTimers();
    
    // Supprimer cookies
    document.cookie = 'superadmin_session=; path=/; max-age=0; secure; samesite=strict';
    document.cookie = 'user_session=; path=/; max-age=0; secure; samesite=strict';
    localStorage.removeItem('superadmin_session');
    
    // Déconnexion via contexte
    await Logout();
    
    // Redirection
    router.push('/?reason=session_expired');
  },[Logout, markAsOffline, router]);

  // Nettoyer tous les timers
  const clearAllTimers = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Démarrer le compte à rebours d'avertissement
  const startWarningCountdown = () => {
    const warningTime = 2 * 60 * 1000; // 2 minutes d'avertissement
    setShowInactivityWarning(true);
    setTimeRemaining(warningTime);

    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  // Réinitialiser le timer d'inactivité
  const resetInactivityTimer = useCallback(() => {
    const sessionData = getSessionData();
    if (!sessionData) return;

    // Mettre à jour la dernière activité
    lastActivityRef.current = Date.now();
    
    // Masquer l'avertissement
    setShowInactivityWarning(false);
    
    // Nettoyer les anciens timers
    clearAllTimers();

    // Timer pour l'avertissement (28 minutes)
    const warningTime = 2 * 60 * 1000; // 2 min avant la fin
    warningTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, inactivityTimeout - warningTime);

    // Timer pour la déconnexion finale (30 minutes)
    inactivityTimerRef.current = setTimeout(() => {
      performAutoLogout();
    }, inactivityTimeout);
  },[inactivityTimeout, performAutoLogout]);

  // Prolonger la session
  const extendSession = () => {
    console.log('✅ Session prolongée par l\'utilisateur');
    sendHeartbeat(); // Envoyer un heartbeat immédiat
    resetInactivityTimer();
  };

  // Initialisation
  useEffect(() => {
    const isProtectedPage = !window.location.pathname.match(/^\/(login)?$/);
    if (!isProtectedPage) return;

    const sessionData = getSessionData();
    if (!sessionData) {
      console.log('❌ Pas de session au montage');
      return;
    }

    console.log('🚀 Système de présence initialisé');
    console.log('   Timeout d\'inactivité: 30 minutes');
    console.log('   Heartbeat: toutes les 30 secondes');

    // Marquer comme online
    markAsOnline();

    // Démarrer le heartbeat
    startHeartbeat();

    // Démarrer le timer d'inactivité
    resetInactivityTimer();

    // Écouter les événements d'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Nettoyer à la fermeture
    const handleBeforeUnload = () => {
      markAsOffline();
      stopHeartbeat();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopHeartbeat();
      clearAllTimers();
      markAsOffline();
    };
  }, [markAsOffline, markAsOnline, resetInactivityTimer, startHeartbeat]);

  return {
    isOnline,
    showInactivityWarning,
    timeRemaining,
    extendSession,
    performAutoLogout,
  };
}