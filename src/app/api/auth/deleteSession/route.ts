import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, sessionTimeout } = await req.json();

    const { data: sessions, error } = await supabaseAdmin
      .from("sessions_actives")
      .select("*")
      .eq("email", email);

    if (error) {
      return new Response(JSON.stringify({ success: false, error }), { status: 400 });
    }

    const now = new Date().getTime();
    if (sessions) {
      for (const session of sessions) {
        const lastActivity = new Date(session.last_activity).getTime();
        if (now - lastActivity > sessionTimeout) {
          await supabaseAdmin
            .from("sessions_actives")
            .delete()
            .eq("id", session.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("Erreur API deleteExpiredSessions:", err);
    return new Response(JSON.stringify({ success: false, error: err }), { status: 500 });
  }
}
