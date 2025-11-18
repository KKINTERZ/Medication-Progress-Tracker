import { useEffect } from 'react';
import { Medication } from '../types';

const REMINDER_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3';

/**
 * Gets the current date in the user's local timezone and formats it as a 'YYYY-MM-DD' string.
 * This approach is timezone-safe because it constructs the date string from the local date
 * components provided by the browser (`getFullYear`, `getMonth`, `getDate`), rather than relying on
 * string formatting methods like `toISOString()` which are based on UTC.
 */
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useNotificationScheduler = (
  medications: Medication[], 
  onUpdateMedication: (medicationId: string, newDosesTaken: Record<string, number>) => void,
  isAutoLoggingEnabled: boolean
) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const reminderAudio = new Audio(REMINDER_SOUND_URL);

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = getTodayDateString();

      medications.forEach(med => {
        const totalDosesTaken = Object.values(med.dosesTaken).reduce((sum, count) => sum + count, 0);
        const tabletsTaken = totalDosesTaken * (med.tabletsPerDose || 1);
        const isCompleted = med.totalTablets - tabletsTaken <= 0;
        const dosesTakenToday = med.dosesTaken[today] || 0;
        const shouldNotify = !isCompleted && med.reminders?.includes(currentTime) && dosesTakenToday < med.dosesPerDay;

        if (shouldNotify) {
          // Fire visual notification
          new Notification('Medication Reminder', {
            body: `It's time to take your ${med.name}.`,
            icon: '/favicon.svg',
            lang: 'en-US',
            dir: 'ltr',
          });
          
          // Play audio alert
          reminderAudio.play().catch(e => console.error("Error playing reminder sound:", e));

          // Auto-log dose if enabled
          if (isAutoLoggingEnabled) {
            const newDosesTaken = {
              ...med.dosesTaken,
              [today]: (med.dosesTaken[today] || 0) + 1,
            };
            onUpdateMedication(med.id, newDosesTaken);
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [medications, isAutoLoggingEnabled, onUpdateMedication]);
};