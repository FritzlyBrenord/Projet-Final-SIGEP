// src/app/api/presence/check-active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, user_id } = body;

    if (!email && !user_id) {
      return NextResponse.json(
        { error: 'Email ou user_id requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a une session active (< 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq(email ? 'email' : 'user_id', email || user_id)
      .eq('status', 'online')
      .gte('last_activity', twoMinutesAgo);

    if (error) {
      console.error('Erreur check active:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    const isActive = data && data.length > 0;

    if (isActive) {
      const session = data[0];
      return NextResponse.json({
        isActive: true,
        session: {
          ip_address: session.ip_address,
          connected_at: session.connected_at,
          last_activity: session.last_activity,
          user_agent: session.user_agent,
        },
      });
    }

    return NextResponse.json({
      isActive: false,
      session: null,
    });

  } catch (error) {
    console.error('Erreur check active:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}