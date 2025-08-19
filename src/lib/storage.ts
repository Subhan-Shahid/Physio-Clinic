// Local Storage utilities for Mindspire Physiotherapy Software

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  currentCondition: string;
  treatmentGoals: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'completed';
  assignedTherapist?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'assessment' | 'therapy' | 'followup' | 'consultation';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  treatmentProvided?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  services: Array<{
    name: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  supplierContact: string;
  lastOrdered?: string;
  expiryDate?: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'therapist' | 'receptionist';
  specialization?: string;
  licenseNumber?: string;
  hireDate: string;
  status: 'active' | 'inactive';
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'inventory' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  targetUserId?: string;
}

// Application Settings model
export interface Settings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialization: string;
    licenseNumber: string;
  };
  clinic: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    paymentReminders: boolean;
    lowStockAlerts: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: 'en' | 'ur';
    currency: 'USD' | 'PKR';
  };
  schedule: {
    defaultAppointmentDuration: '30' | '45' | '60' | '90' | '120' | string;
    workingHoursStart: string; // HH:mm
    workingHoursEnd: string;   // HH:mm
    timeZone: string;
  };
}

// Storage keys
const STORAGE_KEYS = {
  PATIENTS: 'mindspire_patients',
  APPOINTMENTS: 'mindspire_appointments',
  INVOICES: 'mindspire_invoices',
  INVENTORY: 'mindspire_inventory',
  STAFF: 'mindspire_staff',
  NOTIFICATIONS: 'mindspire_notifications',
  SETTINGS: 'mindspire_settings',
} as const;

// Default settings
const DEFAULT_SETTINGS: Settings = {
  profile: {
    firstName: 'Dr. Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@mindspire.com',
    phone: '+1-555-1001',
    specialization: 'Orthopedic Physiotherapy',
    licenseNumber: 'PT-12345',
  },
  clinic: {
    name: 'Mindspire Physiotherapy',
    address: '123 Healthcare Drive, Medical District',
    phone: '+1-555-0100',
    email: 'info@mindspire.com',
    website: 'www.mindspire.com',
    taxId: '12-3456789',
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    paymentReminders: true,
    lowStockAlerts: true,
    systemUpdates: false,
  },
  appearance: {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    currency: 'USD',
  },
  schedule: {
    defaultAppointmentDuration: '60',
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    timeZone: 'America/New_York',
  },
};

// Generic storage functions
export const storage = {
  get: <T>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return [];
    }
  },

  set: <T>(key: string, data: T[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('storage-update', { 
        detail: { key, data } 
      }));
    } catch (error) {
      console.error(`Error writing to localStorage:`, error);
    }
  },

  add: <T extends { id: string; createdAt: string; updatedAt: string }>(
    key: string, 
    item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): T => {
    const items = storage.get<T>(key);
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    } as T;
    
    items.push(newItem);
    storage.set(key, items);
    return newItem;
  },

  update: <T extends { id: string; updatedAt: string }>(
    key: string, 
    id: string, 
    updates: Partial<T>
  ): T | null => {
    const items = storage.get<T>(key);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    items[index] = updatedItem;
    storage.set(key, items);
    return updatedItem;
  },

  delete: (key: string, id: string): boolean => {
    const items = storage.get(key);
    const filteredItems = items.filter((item: any) => item.id !== id);
    
    if (filteredItems.length !== items.length) {
      storage.set(key, filteredItems);
      return true;
    }
    return false;
  },

  clear: (key: string): void => {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('storage-update', { 
      detail: { key, data: [] } 
    }));
  },
};

// Settings storage (single-document helpers)
export const settingsStorage = {
  get: (): Settings => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (item) {
        const parsed = JSON.parse(item) as Settings;
        // Sanitize unsupported languages to 'en'
        const allowedLangs = ['en', 'ur'] as const;
        if (!allowedLangs.includes(parsed.appearance.language as any)) {
          parsed.appearance.language = 'en';
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  },
  set: (settings: Settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('storage-update', {
        detail: { key: STORAGE_KEYS.SETTINGS, data: settings }
      }));
    } catch (e) {
      console.error('Error writing settings:', e);
    }
  },
  update: (partial: Partial<Settings>) => {
    const current = settingsStorage.get();
    const next: Settings = {
      ...current,
      ...partial,
      // nested merges when provided
      profile: { ...current.profile, ...(partial.profile || {}) },
      clinic: { ...current.clinic, ...(partial.clinic || {}) },
      notifications: { ...current.notifications, ...(partial.notifications || {}) },
      appearance: { ...current.appearance, ...(partial.appearance || {}) },
      schedule: { ...current.schedule, ...(partial.schedule || {}) },
    };
    settingsStorage.set(next);
    return next;
  }
};

// Specific storage functions
export const patientStorage = {
  getAll: () => storage.get<Patient>(STORAGE_KEYS.PATIENTS),
  add: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => 
    storage.add<Patient>(STORAGE_KEYS.PATIENTS, patient),
  update: (id: string, updates: Partial<Patient>) => 
    storage.update<Patient>(STORAGE_KEYS.PATIENTS, id, updates),
  delete: (id: string) => storage.delete(STORAGE_KEYS.PATIENTS, id),
  getById: (id: string) => storage.get<Patient>(STORAGE_KEYS.PATIENTS).find(p => p.id === id),
};

export const appointmentStorage = {
  getAll: () => storage.get<Appointment>(STORAGE_KEYS.APPOINTMENTS),
  add: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => 
    storage.add<Appointment>(STORAGE_KEYS.APPOINTMENTS, appointment),
  update: (id: string, updates: Partial<Appointment>) => 
    storage.update<Appointment>(STORAGE_KEYS.APPOINTMENTS, id, updates),
  delete: (id: string) => storage.delete(STORAGE_KEYS.APPOINTMENTS, id),
  getById: (id: string) => storage.get<Appointment>(STORAGE_KEYS.APPOINTMENTS).find(a => a.id === id),
  getByPatient: (patientId: string) => 
    storage.get<Appointment>(STORAGE_KEYS.APPOINTMENTS).filter(a => a.patientId === patientId),
  getByDate: (date: string) => 
    storage.get<Appointment>(STORAGE_KEYS.APPOINTMENTS).filter(a => a.date === date),
};

export const invoiceStorage = {
  getAll: () => storage.get<Invoice>(STORAGE_KEYS.INVOICES),
  add: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => 
    storage.add<Invoice>(STORAGE_KEYS.INVOICES, invoice),
  update: (id: string, updates: Partial<Invoice>) => 
    storage.update<Invoice>(STORAGE_KEYS.INVOICES, id, updates),
  delete: (id: string) => storage.delete(STORAGE_KEYS.INVOICES, id),
  getById: (id: string) => storage.get<Invoice>(STORAGE_KEYS.INVOICES).find(i => i.id === id),
  getByPatient: (patientId: string) => 
    storage.get<Invoice>(STORAGE_KEYS.INVOICES).filter(i => i.patientId === patientId),
  getOverdue: () => {
    const today = new Date().toISOString().split('T')[0];
    return storage.get<Invoice>(STORAGE_KEYS.INVOICES).filter(
      i => i.status !== 'paid' && i.dueDate < today
    );
  },
};

export const inventoryStorage = {
  getAll: () => storage.get<InventoryItem>(STORAGE_KEYS.INVENTORY),
  add: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => 
    storage.add<InventoryItem>(STORAGE_KEYS.INVENTORY, item),
  update: (id: string, updates: Partial<InventoryItem>) => 
    storage.update<InventoryItem>(STORAGE_KEYS.INVENTORY, id, updates),
  delete: (id: string) => storage.delete(STORAGE_KEYS.INVENTORY, id),
  getById: (id: string) => storage.get<InventoryItem>(STORAGE_KEYS.INVENTORY).find(i => i.id === id),
  getLowStock: () => 
    storage.get<InventoryItem>(STORAGE_KEYS.INVENTORY).filter(i => i.currentStock <= i.minStock),
};

export const staffStorage = {
  getAll: () => storage.get<Staff>(STORAGE_KEYS.STAFF),
  add: (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => 
    storage.add<Staff>(STORAGE_KEYS.STAFF, staff),
  update: (id: string, updates: Partial<Staff>) => 
    storage.update<Staff>(STORAGE_KEYS.STAFF, id, updates),
  delete: (id: string) => storage.delete(STORAGE_KEYS.STAFF, id),
  getById: (id: string) => storage.get<Staff>(STORAGE_KEYS.STAFF).find(s => s.id === id),
  getTherapists: () => 
    storage.get<Staff>(STORAGE_KEYS.STAFF).filter(s => s.role === 'therapist' && s.status === 'active'),
};

export const notificationStorage = {
  getAll: () => storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  add: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const notifications = storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification); // Add to beginning
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },
  /**
   * Add a notification only if a similar one hasn't been created today.
   * Similarity is based on type + title + message string match.
   */
  addIfNotExists: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const notifications = storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const today = new Date().toISOString().split('T')[0];
    const existsToday = notifications.some(n =>
      n.type === notification.type &&
      n.title === notification.title &&
      n.message === notification.message &&
      n.createdAt.startsWith(today)
    );
    if (existsToday) return null;
    return notificationStorage.add(notification);
  },
  markAsRead: (id: string) => {
    const notifications = storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  },
  markAllAsRead: () => {
    const notifications = storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    notifications.forEach(n => n.isRead = true);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.NOTIFICATIONS, id),
  getUnread: () => 
    storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS).filter(n => !n.isRead),
};

// Initialize with empty data (no demo data)
export const initializeData = () => {
  // Only initialize if no data exists - starts empty
  if (storage.get<Patient>(STORAGE_KEYS.PATIENTS).length === 0) {
    // Initialize with some staff members only
    const initialStaff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@mindspire.com",
        phone: "+1-555-1001",
        role: "therapist",
        specialization: "Orthopedic Physiotherapy",
        licenseNumber: "PT-12345",
        hireDate: "2020-01-15",
        status: "active",
        schedule: [
          { day: "Monday", startTime: "08:00", endTime: "17:00", isAvailable: true },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00", isAvailable: true },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00", isAvailable: true },
          { day: "Thursday", startTime: "08:00", endTime: "17:00", isAvailable: true },
          { day: "Friday", startTime: "08:00", endTime: "15:00", isAvailable: true },
        ]
      },
      {
        firstName: "Mike",
        lastName: "Chen",
        email: "mike.chen@mindspire.com",
        phone: "+1-555-1002",
        role: "therapist",
        specialization: "Sports Medicine",
        licenseNumber: "PT-12346",
        hireDate: "2021-03-20",
        status: "active",
        schedule: [
          { day: "Monday", startTime: "09:00", endTime: "18:00", isAvailable: true },
          { day: "Tuesday", startTime: "09:00", endTime: "18:00", isAvailable: true },
          { day: "Wednesday", startTime: "09:00", endTime: "18:00", isAvailable: true },
          { day: "Thursday", startTime: "09:00", endTime: "18:00", isAvailable: true },
          { day: "Friday", startTime: "09:00", endTime: "16:00", isAvailable: true },
        ]
      }
    ];

    // Only add staff members for system functionality
    initialStaff.forEach(staff => staffStorage.add(staff));
  }

  // Ensure settings exist
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Error initializing settings:', e);
    }
  }
};