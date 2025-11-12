// src/app/api/presence/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array requis' },
        { status: 400 }
      );
    }

    // Augmenter la fenêtre de temps à 2 minutes pour une détection plus fiable
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    // Récupérer TOUTES les entrées pour ces emails, pas seulement les en ligne
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('email', emails)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Erreur status:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Grouper par email pour prendre la dernière activité de chaque utilisateur
    const latestActivities = new Map();
    
    data?.forEach(presence => {
      const existing = latestActivities.get(presence.email);
      if (!existing || new Date(presence.last_activity) > new Date(existing.last_activity)) {
        latestActivities.set(presence.email, presence);
      }
    });

    // Calculer le statut pour chaque utilisateur
    const statuses = Array.from(latestActivities.values()).map(presence => {
      const lastActivity = new Date(presence.last_activity);
      const isOnline = 
        presence.status === 'online' && 
        lastActivity > new Date(twoMinutesAgo);

      // Calculer la durée de la dernière session
      let sessionDuration = null;
      if (presence.connected_at && presence.disconnected_at) {
        const start = new Date(presence.connected_at).getTime();
        const end = new Date(presence.disconnected_at).getTime();
        sessionDuration = Math.floor((end - start) / 1000);
      } else if (presence.connected_at && isOnline) {
        // Si toujours connecté, calculer depuis le début de la session
        const start = new Date(presence.connected_at).getTime();
        const now = Date.now();
        sessionDuration = Math.floor((now - start) / 1000);
      }

      return {
        email: presence.email,
        isOnline,
        status: presence.status,
        connected_at: presence.connected_at,
        disconnected_at: presence.disconnected_at,
        last_activity: presence.last_activity,
        ip_address: presence.ip_address,
        session_duration: sessionDuration,
      };
    });

    // Inclure aussi les utilisateurs sans entrée de présence (hors ligne)
    emails.forEach(email => {
      if (!latestActivities.has(email)) {
        statuses.push({
          email,
          isOnline: false,
          status: 'offline',
          connected_at: null,
          disconnected_at: null,
          last_activity: null,
          ip_address: null,
          session_duration: null,
        });
      }
    });

    return NextResponse.json({
      success: true,
      statuses,
    });

  } catch (error) {
    console.error('Erreur status:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}