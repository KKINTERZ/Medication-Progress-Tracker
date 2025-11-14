import React, { useMemo } from 'react';
import { Medication } from '../types';
import { PillIcon, CalendarIcon, TrashIcon, BellIcon, EditIcon, HistoryIcon, ShareIcon, ClockIcon } from './Icons';

interface MedicationCardProps {
  medication: Medication;
  onUpdate: (med: Medication) => void;
  onDelete: (id: string) => void;
  onEdit: (med: Medication) => void;
  onShowHistory: (med: Medication) => void;
}

const getTodayDateString = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onUpdate, onDelete, onEdit, onShowHistory }) => {
  const { name, totalTablets, tabletsPerDay, dosesTaken, id, reminders } = medication;

  const today = getTodayDateString();
  const dosesTakenToday = dosesTaken[today] || 0;

  const handleTakeDose = () => {
    if (dosesTakenToday < tabletsPerDay && tabletsRemaining > 0) {
      const newDosesTaken = {
        ...dosesTaken,
        [today]: (dosesTaken[today] || 0) + 1,
      };
      onUpdate({ ...medication, dosesTaken: newDosesTaken });
    }
  };

  const { tabletsRemaining } = useMemo(() => {
    const totalDosesTaken = Object.values(dosesTaken).reduce((sum, count) => sum + count, 0);
    const remainingTabs = totalTablets - totalDosesTaken;
    
    return {
      tabletsRemaining: remainingTabs,
    };
  }, [dosesTaken, totalTablets]);

  const daysRemaining = useMemo(() => {
    if (tabletsRemaining <= 0) return 0;
    const dosesTakenTodayCount = dosesTaken[today] || 0;
    const dosesLeftForToday = tabletsPerDay - dosesTakenTodayCount;
    if (tabletsRemaining <= dosesLeftForToday) {
        return 1;
    }
    const tabletsAfterToday = tabletsRemaining - dosesLeftForToday;
    return 1 + Math.ceil(tabletsAfterToday / tabletsPerDay);
  }, [tabletsRemaining, tabletsPerDay, dosesTaken, today]);

  
  const isCompleted = tabletsRemaining <= 0;
  const canTakeToday = dosesTakenToday < tabletsPerDay && !isCompleted;

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
        // FIX: Corrected a syntax error in the try-catch block by adding curly braces.
      } catch (err) {
        alert('Failed to copy progress to clipboard.');
      }
    }
  };

  const sortedHistory = useMemo(() => {
    return Object.entries(dosesTaken).sort(([dateA], [dateB]) => {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [dosesTaken]);

  const recentHistory = sortedHistory.slice(0, 3);
    
  const formatHistoryDate = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    // Adjust for timezone offset
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderReminderInfo = () => {
    if (isCompleted) {
      return null;
    }

    if (dosesTakenToday >= tabletsPerDay) {
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
                    onClick={() => onDelete(id)}
                    className="p-1.5 rounded-full text-brand-gray-400 dark:text-brand-gray-500 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete ${name}`}
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
        
        {renderReminderInfo()}

        <div className="grid grid-cols-3 gap-x-4 my-6 py-4 text-center border-t border-b border-brand-gray-100 dark:border-brand-gray-700">
            <div className="space-y-1">
                <CalendarIcon className="w-6 h-6 mx-auto text-brand-gold" />
                <p className="font-bold text-2xl text-brand-gray-800 dark:text-brand-gray-100">{daysRemaining}</p>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Days Left</p>
            </div>
            <div className="space-y-1">
                <PillIcon className="w-6 h-6 mx-auto text-brand-success-DEFAULT" />
                <p className="font-bold text-2xl text-brand-gray-800 dark:text-brand-gray-100">{tabletsRemaining}</p>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Tablets Left</p>
            </div>
            <div className="space-y-1">
                <ClockIcon className="w-6 h-6 mx-auto text-brand-gold-dark" />
                <p className="font-bold text-2xl text-brand-gray-800 dark:text-brand-gray-100">
                    {dosesTakenToday}<span className="text-brand-gray-400 dark:text-brand-gray-500 text-lg">/{tabletsPerDay}</span>
                </p>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Doses Today</p>
            </div>
        </div>
        
        {sortedHistory.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-brand-gray-600 dark:text-brand-gray-400">Recent History</h4>
                <ul className="space-y-1.5 text-sm">
                {recentHistory.map(([date, count]) => (
                    <li key={date} className="flex justify-between items-center text-brand-gray-500 dark:text-brand-gray-400">
                    <span>{formatHistoryDate(date)}</span>
                    <span className="font-medium text-brand-gray-700 dark:text-brand-gray-300">{count} {count > 1 ? 'doses' : 'dose'}</span>
                    </li>
                ))}
                </ul>
                {sortedHistory.length > 3 && (
                <button 
                    onClick={() => onShowHistory(medication)} 
                    className="text-sm font-medium text-center w-full mt-2 text-brand-gold-DEFAULT hover:text-brand-gold-dark dark:hover:text-brand-gold-light focus:outline-none focus:underline"
                >
                    View full history
                </button>
                )}
            </div>
        )}

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
                className={`w-full max-w-xs inline-flex items-center justify-center gap-2 px-4 py-3 border-2 text-base font-medium rounded-lg shadow-md transition-all duration-200 
                    ${!canTakeToday 
                    ? 'border-transparent bg-brand-gray-300 text-white dark:bg-brand-gray-600 cursor-not-allowed' 
                    : 'bg-brand-gold-dark text-white border-transparent hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark'
                    }`}
                >
                  <PillIcon className="w-5 h-5" />
                  <span>
                    Take Dose <span className="font-bold">({dosesTakenToday}/{tabletsPerDay})</span>
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