import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useStorage } from "@/hooks/useStorage";
import { notificationStorage } from "@/lib/storage";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon, Monitor } from "lucide-react";

const AppLayout = () => {
  // Subscribe to changes in invoices and inventory to drive notifications
  const invoices = useStorage<any>("mindspire_invoices");
  const inventory = useStorage<any>("mindspire_inventory");
  const appointments = useStorage<any>("mindspire_appointments");
  const { settings, update } = useSettings();
  const { user, logout } = useAuth();

  const toggleTheme = () => {
    const currentTheme = settings.appearance.theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
    update({ appearance: { ...settings.appearance, theme: nextTheme } });
  };

  const getThemeIcon = () => {
    switch (settings.appearance.theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    const today = new Date();
    const yyyyMmDd = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = yyyyMmDd(today);

    const addDays = (d: Date, days: number) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd;
    };
    const soonDateStr = yyyyMmDd(addDays(today, 3)); // due within 3 days
    const now = new Date();
    const todayStrLocal = todayStr;

    // Payment: overdue invoices
    if (settings.notifications.paymentReminders) {
      invoices
        .filter((i: any) => i.status !== "paid" && i.dueDate < todayStr)
        .forEach((i: any) => {
          notificationStorage.addIfNotExists({
            type: "payment",
            title: `Invoice overdue: ${i.patientName || i.patientId}`,
            message: `Invoice ${i.id} is overdue since ${i.dueDate}. Total ${Number(i.total).toFixed(2)}.`,
            priority: "high",
            isRead: false,
          });
        });
    }

    // Payment: due soon invoices (within 3 days)
    if (settings.notifications.paymentReminders) {
      invoices
        .filter((i: any) => i.status !== "paid" && i.dueDate >= todayStr && i.dueDate <= soonDateStr)
        .forEach((i: any) => {
          notificationStorage.addIfNotExists({
            type: "payment",
            title: `Invoice due soon: ${i.patientName || i.patientId}`,
            message: `Invoice ${i.id} is due on ${i.dueDate}. Total ${Number(i.total).toFixed(2)}.`,
            priority: "medium",
            isRead: false,
          });
        });
    }

    // Inventory: low stock
    if (settings.notifications.lowStockAlerts) {
      inventory
        .filter((it: any) => typeof it.minStock === "number" && typeof it.currentStock === "number" && it.currentStock <= it.minStock)
        .forEach((it: any) => {
          notificationStorage.addIfNotExists({
            type: "inventory",
            title: `${it.name} low stock`,
            message: `${it.name} is at ${it.currentStock}${it.unit ? " " + it.unit : ""} (min ${it.minStock}).`,
            priority: "high",
            isRead: false,
          });
        });
    }

    // Appointments: upcoming
    if (settings.notifications.appointmentReminders) {
      appointments
        .filter((a: any) => a.status === "scheduled")
        .forEach((a: any) => {
          if (!a.date || !a.time) return;
          // Build local datetime from date and time (HH:MM)
          const apptDateTime = new Date(`${a.date}T${a.time}:00`);
          const diffMs = apptDateTime.getTime() - now.getTime();
          // Skip past appointments
          if (diffMs < 0) return;
          const diffMinutes = Math.floor(diffMs / 60000);
          // Within 60 minutes => high
          if (diffMinutes <= 60 && a.date === todayStrLocal) {
            notificationStorage.addIfNotExists({
              type: "appointment",
              title: `Appointment starting soon: ${a.patientName}`,
              message: `${a.patientName} with ${a.therapistName} at ${a.time}`,
              priority: "high",
              isRead: false,
            });
            return;
          }
          // Later today => medium
          if (a.date === todayStrLocal) {
            notificationStorage.addIfNotExists({
              type: "appointment",
              title: `Today's appointment: ${a.patientName}`,
              message: `${a.patientName} with ${a.therapistName} at ${a.time}`,
              priority: "medium",
              isRead: false,
            });
          }
        });
    }
  }, [invoices, inventory, appointments, settings.notifications]);

  // Apply language globally
  useEffect(() => {
    const root = document.documentElement;
    const lang = settings.appearance.language || 'en';
    root.setAttribute('lang', lang);
    // Direction and language-specific class
    const isUrdu = lang === 'ur';
    root.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');
    root.classList.toggle('lang-ur', isUrdu);
  }, [settings.appearance.language]);

  // Apply theme globally with system change listener
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const desired = settings.appearance.theme; // 'light' | 'dark' | 'system'
      const dark = desired === 'system' ? prefersDark : desired === 'dark';
      root.classList.toggle('dark', dark);
    };

    applyTheme();

    let mql: MediaQueryList | null = null;
    const handler = () => applyTheme();
    if (settings.appearance.theme === 'system' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      // Support older browsers
      if (mql.addEventListener) mql.addEventListener('change', handler);
      else if ((mql as any).addListener) (mql as any).addListener(handler);
    }

    return () => {
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener('change', handler);
        else if ((mql as any).removeListener) (mql as any).removeListener(handler);
      }
    };
  }, [settings.appearance.theme]);

  // Apply font size globally via Tailwind typography utilities
  useEffect(() => {
    const root = document.documentElement;
    const sizeClassMap: Record<string, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };
    // Remove previous size classes before applying the new one
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    const next = sizeClassMap[settings.appearance.fontSize] || 'text-base';
    root.classList.add(next);
  }, [settings.appearance.fontSize]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Global header with sidebar toggle */}
          <header className="sticky top-0 z-40 h-14 border-b bg-card/50 backdrop-blur-sm px-4 flex items-center">
            <SidebarTrigger />
            <h1 className="ml-3 text-base font-semibold">{settings.clinic.name || 'Mindspire'}</h1>
            <div className="ml-auto flex items-center gap-3">
              {user?.displayName && (
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.displayName}</span>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 border rounded-md hover:bg-accent transition-colors"
                title={`Current theme: ${settings.appearance.theme}`}
              >
                {getThemeIcon()}
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
              >
                Logout
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
