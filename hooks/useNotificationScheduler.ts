import { useEffect } from 'react';
import { Medication } from '../types';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useNotificationScheduler = (medications: Medication[]) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = getTodayDateString();

      medications.forEach(med => {
        const totalTaken = Object.values(med.dosesTaken).reduce((sum, count) => sum + count, 0);
        const isCompleted = med.totalTablets - totalTaken <= 0;
        const dosesTakenToday = med.dosesTaken[today] || 0;

        if (!isCompleted && med.reminders?.includes(currentTime) && dosesTakenToday < med.tabletsPerDay) {
          new Notification('Medication Reminder', {
            body: `It's time to take your ${med.name}.`,
            icon: '/favicon.svg',
            lang: 'en-US',
            dir: 'ltr',
          });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [medications]);
};
