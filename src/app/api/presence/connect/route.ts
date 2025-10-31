// src/app/api/presence/connect/route.ts
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

    if (!user_id || !email || !session_token) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // ✅ VÉRIFIER SI L'UTILISATEUR EXISTE DÉJÀ
    const { data: existing } = await supabase
      .from('user_presence')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      // ✅ UPDATE : Mettre à jour la ligne existante
      const { data, error } = await supabase
        .from('user_presence')
        .update({
          user_id,
          session_token,
          status: 'online',
          ip_address,
          user_agent,
          last_activity: new Date().toISOString(),
          connected_at: new Date().toISOString(),
          disconnected_at: null, // Réinitialiser
        })
        .eq('email', email)
        .select()
        .single();

      if (error) {
        console.error('Erreur update presence:', error);
        return NextResponse.json(
          { error: 'Erreur serveur' },
          { status: 500 }
        );
      }

      console.log(`🔄 Présence mise à jour: ${email} (IP: ${ip_address})`);
      return NextResponse.json({ 
        success: true,
        action: 'updated',
        presence: data
      });

    } else {
      // ✅ INSERT : Créer une nouvelle ligne
      const { data, error } = await supabase
        .from('user_presence')
        .insert({
          user_id,
          email,
          session_token,
          status: 'online',
          ip_address,
          user_agent,
          connected_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur insert presence:', error);
        return NextResponse.json(
          { error: 'Erreur serveur' },
          { status: 500 }
        );
      }

      console.log(`🟢 Nouvelle présence créée: ${email} (IP: ${ip_address})`);
      return NextResponse.json({ 
        success: true,
        action: 'created',
        presence: data
      });
    }

  } catch (error) {
    console.error('Erreur connect:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}