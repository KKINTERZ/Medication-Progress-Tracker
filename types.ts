export interface Medication {
  id: string;
  name: string;
  totalTablets: number;
  tabletsPerDay: number;
  startDate: string; // ISO string for the start date
  dosesTaken: Record<string, number>; // Maps date 'YYYY-MM-DD' to number of tablets taken
  reminders?: string[]; // Array of reminder times in 'HH:mm' format
}
