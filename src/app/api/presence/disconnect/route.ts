// src/app/api/presence/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, session_token } = body;

    // ✅ Utiliser email pour identifier l'utilisateur
    if (!email) {
      return NextResponse.json(
        { error: 'Email manquant' },
        { status: 400 }
      );
    }

    // ✅ UPDATE : Marquer comme offline (ne pas supprimer)
    const { error } = await supabase
      .from('user_presence')
      .update({
        status: 'offline',
        disconnected_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('Erreur disconnect:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    console.log(`⚫ Utilisateur déconnecté: ${email}`);

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur disconnect:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}