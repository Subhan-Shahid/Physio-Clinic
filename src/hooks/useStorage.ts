import { useState, useEffect } from 'react';

// Custom hook for real-time storage updates
export function useStorage<T>(key: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageUpdate = (event: CustomEvent) => {
      if (event.detail.key === key) {
        setData(event.detail.data);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setData(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change:`, error);
        }
      }
    };

    // Listen for custom storage update events (same tab)
    window.addEventListener('storage-update', handleStorageUpdate as EventListener);
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage-update', handleStorageUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return data;
}

// Hook for managing notifications with real-time updates
export function useNotifications() {
  const notifications = useStorage('mindspire_notifications', []);
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

// Hook for real-time stats
export function useRealtimeStats() {
  const patients = useStorage('mindspire_patients', []);
  const appointments = useStorage('mindspire_appointments', []);
  const invoices = useStorage('mindspire_invoices', []);
  const inventory = useStorage('mindspire_inventory', []);

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter((p: any) => p.status === 'active').length,
    todayAppointments: appointments.filter((a: any) => a.date === today).length,
    completedAppointments: appointments.filter((a: any) => a.date === today && a.status === 'completed').length,
    upcomingAppointments: appointments.filter((a: any) => a.date === today && a.status === 'scheduled').length,
    totalRevenue: invoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + invoice.total, 0),
    todayRevenue: invoices
      .filter((i: any) => 
        i.status === 'paid' && 
        i.paidDate && 
        i.paidDate.startsWith(today)
      )
      .reduce((sum: number, invoice: any) => sum + invoice.total, 0),
    pendingInvoices: invoices.filter((i: any) => i.status === 'pending').length,
    overdueInvoices: invoices.filter((i: any) => {
      return i.status !== 'paid' && i.dueDate < today;
    }).length,
    overdueAmount: invoices
      .filter((i: any) => i.status !== 'paid' && i.dueDate < today)
      .reduce((sum: number, invoice: any) => sum + invoice.total, 0),
    lowStockItems: inventory.filter((item: any) => item.currentStock <= item.minStock).length,
  };

  return stats;
}