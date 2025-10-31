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
    const { emails } = body; // Array d'emails

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array requis' },
        { status: 400 }
      );
    }

    // Récupérer les statuts de tous les emails
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('email', emails);

    if (error) {
      console.error('Erreur status:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Calculer le statut en ligne pour chaque utilisateur
    const statuses = data?.map(presence => {
      const isOnline = 
        presence.status === 'online' && 
        new Date(presence.last_activity) > new Date(twoMinutesAgo);

      // Calculer la durée de la dernière session
      let sessionDuration = null;
      if (presence.connected_at && presence.disconnected_at) {
        const start = new Date(presence.connected_at).getTime();
        const end = new Date(presence.disconnected_at).getTime();
        sessionDuration = Math.floor((end - start) / 1000); // en secondes
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
    }) || [];

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