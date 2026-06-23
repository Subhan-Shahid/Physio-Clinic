// src/lib/localAuth.ts

export const isLocalAuthed = (): boolean => {
  try {
    return localStorage.getItem("devora_is_authed") === "true";
  } catch {
    return false;
  }
};

export const setLocalAuthed = (v: boolean, user?: any): void => {
  try {
    if (v) {
      localStorage.setItem("devora_is_authed", "true");
      if (user) {
        localStorage.setItem("devora_current_user", JSON.stringify(user));
      }
    } else {
      localStorage.removeItem("devora_is_authed");
      localStorage.removeItem("devora_current_user");
    }
    // Dispatch a custom event to notify useAuth instances
    window.dispatchEvent(new Event("local-auth-change"));
  } catch (error) {
    console.error("localAuth error:", error);
  }
};

export const getLocalUser = (): any => {
  try {
    const u = localStorage.getItem("devora_current_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};
