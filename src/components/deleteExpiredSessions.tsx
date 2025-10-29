const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const deleteExpiredSessions = async (email: string) => {
  try {
    await fetch("/api/sessions/deleteExpired", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sessionTimeout: SESSION_TIMEOUT }),
    });
  } catch (err) {
    console.error("Erreur suppression sessions expirées:", err);
  }
};
