import { useState, useEffect } from 'react';
import { subscribePatients } from '@/lib/patientsFirestore';
import { subscribeAppointments } from '@/lib/appointmentsFirestore';
import { subscribeInvoices } from '@/lib/billingFirestore';
import { useStorage } from './useStorage';

export function useDashboardStats() {
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // Keep inventory from localStorage for now
  const inventory = useStorage('devora_inventory', []);

  useEffect(() => {
    const unsubscribePatients = subscribePatients(setPatients);
    const unsubscribeAppointments = subscribeAppointments(setAppointments);
    const unsubscribeInvoices = subscribeInvoices(setInvoices);

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
      unsubscribeInvoices();
    };
  }, []);

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

  return { stats, appointments };
}
