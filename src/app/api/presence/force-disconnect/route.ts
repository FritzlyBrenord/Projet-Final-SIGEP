// src/app/api/presence/force-disconnect/route.ts
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

    // Déconnecter toutes les sessions actives de cet utilisateur
    const { error } = await supabase
      .from('user_presence')
      .update({
        status: 'offline',
        disconnected_at: new Date().toISOString(),
      })
      .eq(email ? 'email' : 'user_id', email || user_id)
      .eq('status', 'online');

    if (error) {
      console.error('Erreur force disconnect:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    console.log(`🔴 Déconnexion forcée: ${email || user_id}`);

    return NextResponse.json({
      success: true,
      message: 'Session précédente déconnectée',
    });

  } catch (error) {
    console.error('Erreur force disconnect:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}