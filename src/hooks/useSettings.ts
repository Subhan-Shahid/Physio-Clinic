import { useEffect, useMemo, useState } from "react";
import { settingsStorage, type Settings } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => settingsStorage.get());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      try {
        if (e?.detail?.key === 'devora_settings') {
          setSettings(e.detail.data as Settings);
          return;
        }
      } catch {}
      // Fallback read on any other storage event
      setSettings(settingsStorage.get());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'devora_settings') {
        setSettings(settingsStorage.get());
      }
    };

    window.addEventListener('storage-update', handleUpdate as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage-update', handleUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const actions = useMemo(() => ({
    set: (next: Settings) => settingsStorage.set(next),
    update: (partial: Partial<Settings>) => settingsStorage.update(partial),
  }), []);

  return { settings, ...actions };
}
