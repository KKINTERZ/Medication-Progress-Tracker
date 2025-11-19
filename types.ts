export interface Medication {
  id: string;
  name: string;
  totalTablets: number;
  dosesPerDay: number;
  tabletsPerDose: number;
  startDate: string; // ISO string for the start date
  dosesTaken: Record<string, number>; // Maps date 'YYYY-MM-DD' to number of doses taken
  reminders?: string[]; // Array of reminder times in 'HH:mm' format
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface MedicalFile {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
  createdAt: string;
  notes?: string;
  aiSummary?: string;
}