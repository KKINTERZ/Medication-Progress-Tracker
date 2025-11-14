import React, { useMemo } from 'react';
import { Medication } from '../types';
import ProgressCircle from './ProgressCircle';
import { PillIcon, CalendarIcon, TrashIcon, BellIcon, EditIcon, HistoryIcon, ShareIcon } from './Icons';

interface MedicationCardProps {
  medication: Medication;
  onUpdate: (med: Medication) => void;
  onDelete: (id: string) => void;
  onEdit: (med: Medication) => void;
  onShowHistory: (med: Medication) => void;
}

const getTodayDateString = () => {
  const today = new Date();
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

  const { tabletsRemaining, progressPercentage, totalTaken } = useMemo(() => {
    const totalDosesTaken = Object.values(dosesTaken).reduce((sum, count) => sum + count, 0);
    const remainingTabs = totalTablets - totalDosesTaken;
    const percentage = totalTablets > 0 ? (totalDosesTaken / totalTablets) * 100 : 0;
    
    return {
      tabletsRemaining: remainingTabs,
      progressPercentage: percentage,
      totalTaken: totalDosesTaken,
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
      } catch (err) {
        alert('Failed to copy progress to clipboard.');
      }
    }
  };

  const renderReminderInfo = () => {
    if (isCompleted) {
      return null;
    }

    if (dosesTakenToday >= tabletsPerDay) {
      return (
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-gray-600">
          <BellIcon className="w-5 h-5 flex-shrink-0 text-brand-success-DEFAULT" />
          <span>Doses for today complete.</span>
        </div>
      );
    }

    if (!reminders || reminders.length === 0) {
      return (
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-gray-600">
          <BellIcon className="w-5 h-5 flex-shrink-0 text-brand-gray-400" />
          <span>No reminders set.</span>
        </div>
      );
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const sortedReminders = [...reminders].sort();
    const nextReminder = sortedReminders.find(time => time > currentTime);

    if (nextReminder) {
      return (
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-gold-DEFAULT">
          <BellIcon className="w-5 h-5 flex-shrink-0" />
          <span>Next dose at <span className="font-semibold">{formatTime(nextReminder)}</span></span>
        </div>
      );
    }

    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-brand-gray-600">
        <BellIcon className="w-5 h-5 flex-shrink-0 text-brand-gray-400" />
        <span>All reminder times for today have passed.</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-brand-gray-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-brand-gray-800 pr-2 flex-1">{name}</h3>
            <div className="flex items-center space-x-1">
                <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 hover:text-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                    aria-label={`Share progress for ${name}`}
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onShowHistory(medication)}
                    className="p-1.5 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 hover:text-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                    aria-label={`View history for ${name}`}
                >
                    <HistoryIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onEdit(medication)}
                    className="p-1.5 rounded-full text-brand-gray-400 hover:bg-amber-50 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label={`Edit ${name}`}
                >
                    <EditIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={() => onDelete(id)}
                    className="p-1.5 rounded-full text-brand-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete ${name}`}
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
        <p className="text-sm text-brand-gray-500 mt-1">{tabletsPerDay} tablet{tabletsPerDay > 1 ? 's' : ''} per day</p>

        {renderReminderInfo()}

        <div className="flex flex-col sm:flex-row items-center justify-around my-6 gap-6">
          <div className="flex-shrink-0">
            <ProgressCircle percentage={progressPercentage} isCompleted={isCompleted} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
              <div>
                <p className="font-bold text-2xl text-brand-gray-800">{daysRemaining}</p>
                <p className="text-xs text-brand-gray-500">Days Left</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <PillIcon className="w-6 h-6 text-brand-success-DEFAULT" />
              <div>
                <p className="font-bold text-2