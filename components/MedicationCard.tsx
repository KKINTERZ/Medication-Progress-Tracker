import React, { useMemo, useState } from 'react';
import { Medication } from '../types';
import { PillIcon, CalendarIcon, TrashIcon, BellIcon, EditIcon, HistoryIcon, ShareIcon } from './Icons';
import ProgressBar from './ProgressBar';

interface MedicationCardProps {
  medication: Medication;
  onUpdate: (med: Medication) => void;
  onDelete: (id: string) => void;
  onEdit: (med: Medication) => void;
  onShowHistory: (med: Medication) => void;
}

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

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onUpdate, onDelete, onEdit, onShowHistory }) => {
  const { name, totalTablets, dosesPerDay, tabletsPerDose, dosesTaken, id, reminders } = medication;
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const today = getTodayDateString();
  const dosesTakenToday = dosesTaken[today] || 0;
  const currentTabletsPerDose = tabletsPerDose || 1;

  const tabletsRemaining = useMemo(() => {
    const totalDosesTaken = Object.values(dosesTaken).reduce((sum: number, count: number) => sum + count, 0);
    const totalTabletsTaken = totalDosesTaken * currentTabletsPerDose;
    return totalTablets - totalTabletsTaken;
  }, [dosesTaken, totalTablets, currentTabletsPerDose]);

  const percentageCompleted = useMemo(() => {
    if (totalTablets <= 0) return 0;
    const tabletsTaken = totalTablets - tabletsRemaining;
    const percentage = (tabletsTaken / totalTablets) * 100;
    return Math.max(0, Math.min(100, percentage));
  }, [tabletsRemaining, totalTablets]);

  const isCompleted = tabletsRemaining <= 0;
  const canTakeToday = dosesTakenToday < dosesPerDay && !isCompleted;

  const handleTakeDose = () => {
    if (canTakeToday) {
      setIsButtonPressed(true);
      setTimeout(() => setIsButtonPressed(false), 200); // Duration of the button-press animation

      const newDosesTaken = {
        ...dosesTaken,
        [today]: (dosesTaken[today] || 0) + 1,
      };
      onUpdate({ ...medication, dosesTaken: newDosesTaken });
    }
  };

  const daysRemaining = useMemo(() => {
    if (tabletsRemaining <= 0) return 0;

    const dosesTakenTodayCount = dosesTaken[today] || 0;
    const dosesLeftForToday = dosesPerDay - dosesTakenTodayCount;
    
    const tabletsNeededForToday = dosesLeftForToday > 0 ? dosesLeftForToday * currentTabletsPerDose : 0;
    
    if (tabletsRemaining <= tabletsNeededForToday) {
      return 1;
    }

    const remainingTabletsAfterToday = tabletsRemaining - tabletsNeededForToday;
    const tabletsPerFullDay = dosesPerDay * currentTabletsPerDose;

    if (tabletsPerFullDay <= 0) return Infinity;

    return 1 + Math.ceil(remainingTabletsAfterToday / tabletsPerFullDay);
  }, [tabletsRemaining, dosesPerDay, currentTabletsPerDose, dosesTaken, today]);

  
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      onDelete(id);
    }
  };

  const handleShare = async () => {
    const shareText = `Medication Progress for ${name}: I have ${tabletsRemaining} tablets left and ${daysRemaining} days to go!`;
    const shareData = {
      title: 'Medication Progress',
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Could not share content", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Progress copied to clipboard!');
      } catch (err) {
        alert('Failed to copy progress to clipboard.');
      }
    }
  };

  const renderReminderInfo = () => {
    if (isCompleted) {
      return null;
    }

    if (dosesTakenToday >= dosesPerDay) {
      return (
        <div className="mt-2 flex items-center gap-2 text-sm text-brand-gray-600 dark:text-brand-gray-400">
          <BellIcon className="w-5 h-5 flex-shrink-0 text-brand-success-DEFAULT" />
          <span>Doses for today complete.</span>
        </div>
      );
    }

    if (!reminders || reminders.length === 0) {
      return null;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const sortedReminders = [...reminders].sort();
    const nextReminder = sortedReminders.find(time => time > currentTime);

    if (nextReminder) {
      return (
        <div className="mt-2 flex items-center gap-2 text-sm text-brand-gold-DEFAULT">
          <BellIcon className="w-5 h-5 flex-shrink-0" />
          <span>Next dose at <span className="font-semibold">{formatTime(nextReminder)}</span></span>
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-brand-gray-600 dark:text-brand-gray-400">
        <BellIcon className="w-5 h-5 flex-shrink-0 text-brand-gray-400 dark:text-brand-gray-500" />
        <span>All reminder times for today have passed.</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100 pr-2 flex-1">{name}</h3>
            <div className="flex items-center space-x-1">
                <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full text-brand-gray-400 dark:text-brand-gray-500 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                    aria-label={`Share progress for ${name}`}
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onShowHistory(medication)}
                    className="p-1.5 rounded-full text-brand-gray-400 dark:text-brand-gray-500 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                    aria-label={`View history for ${name}`}
                >
                    <HistoryIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onEdit(medication)}
                    className="p-1.5 rounded-full text-brand-gray-400 dark:text-brand-gray-500 hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:text-amber-600 dark:hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label={`Edit ${name}`}
                >
                    <EditIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={handleDelete}
                    className="p-1.5 rounded-full text-brand-gray-400 dark:text-brand-gray-500 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete ${name}`}
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
        
        {renderReminderInfo()}

        <div className="mt-6 py-4 border-t border-b border-brand-gray-100 dark:border-brand-gray-700">
            <div className="flex items-center gap-x-3">
              <div className="flex-grow">
                <ProgressBar percentage={percentageCompleted} />
              </div>
              <span className="font-bold text-sm text-brand-gold-dark dark:text-brand-gold-light whitespace-nowrap">
                {Math.round(percentageCompleted)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 text-center mt-4">
                <div className="space-y-1">
                    <CalendarIcon className="w-5 h-5 mx-auto text-brand-gold-DEFAULT dark:text-brand-gold-light" />
                    <p className="font-bold text-xl text-brand-gray-800 dark:text-brand-gray-100">{daysRemaining}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Days Left</p>
                </div>
                <div className="space-y-1">
                    <PillIcon className="w-5 h-5 mx-auto text-brand-gold-DEFAULT dark:text-brand-gold-light" />
                    <p className="font-bold text-xl text-brand-gray-800 dark:text-brand-gray-100">
                        {tabletsRemaining}
                    </p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Tablets Left</p>
                </div>
            </div>
        </div>

      </div>

      <div className="bg-brand-gold-light dark:bg-brand-gray-800/50 p-4 mt-auto">
        {isCompleted ? (
             <div className="text-center font-semibold text-brand-success-dark dark:text-brand-success-light bg-brand-success-light dark:bg-green-500/10 py-3 px-4 rounded-lg">
                Course Completed! 🎉
             </div>
        ) : (
            <div className="flex flex-col items-center">
                <button
                onClick={handleTakeDose}
                disabled={!canTakeToday}
                className={`w-full max-w-xs inline-flex items-center justify-center gap-2 px-4 py-3 border-2 text-base font-medium rounded-lg shadow-md transition-transform 
                    ${!canTakeToday 
                    ? 'border-transparent bg-brand-gray-300 text-white dark:bg-brand-gray-600 cursor-not-allowed' 
                    : `bg-brand-gold-dark text-white border-transparent hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark ${isButtonPressed ? 'animate-button-press' : ''}`
                    }`}
                >
                  <PillIcon className="w-5 h-5" />
                  <span>
                    Take Dose <span className="font-bold">({dosesTakenToday}/{dosesPerDay})</span>
                  </span>
                </button>
                {!canTakeToday && tabletsRemaining > 0 && <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-2">You've taken all doses for today.</p>}
            </div>
        )}
      </div>
    </div>
  );
};

export default MedicationCard;