import React from 'react';
import { Medication } from '../types';
import { XIcon, CalendarIcon } from './Icons';

interface MedicationHistoryModalProps {
  medication: Medication;
  onClose: () => void;
}

const MedicationHistoryModal: React.FC<MedicationHistoryModalProps> = ({ medication, onClose }) => {
  const sortedDoses = Object.entries(medication.dosesTaken).sort(([dateA], [dateB]) => {
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Add time to account for timezone offset which can change the date
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-brand-gray-200">
          <div>
            <h2 className="text-xl font-bold text-brand-gray-900">Dose History</h2>
            <p className="text-sm text-brand-gray-600">{medication.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 hover:text-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
            aria-label="Close history modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {sortedDoses.length > 0 ? (
            <ul className="space-y-4">
              {sortedDoses.map(([date, count]) => (
                <li key={date} className="flex items-center justify-between p-4 bg-brand-gold-light rounded-lg border border-brand-gray-200">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
                    <span className="font-medium text-brand-gray-700">{formatDate(date)}</span>
                  </div>
                  <span className="text-lg font-semibold text-brand-gray-800">
                    {count} {count > 1 ? 'doses' : 'dose'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 px-6">
              <CalendarIcon className="mx-auto h-12 w-12 text-brand-gray-300"/>
              <h3 className="mt-4 text-lg font-semibold text-brand-gray-700">No Doses Taken Yet</h3>
              <p className="mt-1 text-sm text-brand-gray-500">
                Your dose history will appear here once you start taking this medication.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationHistoryModal;