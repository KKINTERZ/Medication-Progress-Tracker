import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { PillIcon, PlusIcon, XIcon, BellIcon, EditIcon } from './Icons';

interface AddMedicationFormProps {
  onSave: (data: Omit<Medication, 'id' | 'startDate' | 'dosesTaken'>, id?: string) => void;
  onCancel: () => void;
  medicationToEdit?: Medication | null;
}

const AddMedicationForm: React.FC<AddMedicationFormProps> = ({ onSave, onCancel, medicationToEdit }) => {
  const [name, setName] = useState('');
  const [totalTablets, setTotalTablets] = useState('');
  const [tabletsPerDay, setTabletsPerDay] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
  const [error, setError] = useState('');

  const isEditMode = !!medicationToEdit;

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name);
      setTotalTablets(String(medicationToEdit.totalTablets));
      setTabletsPerDay(String(medicationToEdit.tabletsPerDay));
      const hasReminders = medicationToEdit.reminders && medicationToEdit.reminders.length > 0;
      setRemindersEnabled(hasReminders);
      setReminderTimes(hasReminders ? medicationToEdit.reminders! : ['09:00']);
    }
  }, [medicationToEdit]);

  const perDayCount = parseInt(tabletsPerDay, 10) || 0;

  useEffect(() => {
    // This effect ensures that if the user reduces the number of tablets per day,
    // the number of reminder fields is also reduced to match.
    // It no longer re-adds a reminder if the user deletes the last one, giving them full control.
    if (perDayCount > 0 && reminderTimes.length > perDayCount) {
      setReminderTimes(reminderTimes.slice(0, perDayCount));
    }
  }, [perDayCount, reminderTimes.length]);

  const handleAddReminder = () => {
    if (reminderTimes.length < perDayCount) {
      setReminderTimes([...reminderTimes, '17:00']);
    }
  };

  const handleRemoveReminder = (index: number) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = value;
    setReminderTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(totalTablets, 10);
    const perDay = perDayCount;

    if (!name.trim() || !total || !perDay) {
      setError('All fields are required and must be valid numbers.');
      return;
    }
    if (total <= 0 || perDay <= 0) {
      setError('Tablet counts must be greater than zero.');
      return;
    }
    if (perDay > total) {
      setError('Tablets per day cannot exceed the total number of tablets.');
      return;
    }

    setError('');
    onSave({
      name,
      totalTablets: total,
      tabletsPerDay: perDay,
      reminders: remindersEnabled ? reminderTimes : [],
    }, medicationToEdit?.id);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">{isEditMode ? 'Edit Medication' : 'Add New Medication'}</h2>
          <p className="text-sm text-brand-gray-500 mt-1">
            {isEditMode ? 'Update the details of your prescription.' : 'Enter the details of your prescription.'}
          </p>
        </div>
        <button onClick={onCancel} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 hover:text-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT">
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-gray-700">
            Medication Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 rounded-md shadow-sm placeholder-brand-gray-400 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
              placeholder="e.g., Vitamin D"
            />
          </div>
        </div>
        <div>
          <label htmlFor="total-tablets" className="block text-sm font-medium text-brand-gray-700">
            Total Tablets in Prescription
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="total-tablets"
              value={totalTablets}
              onChange={(e) => setTotalTablets(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 rounded-md shadow-sm placeholder-brand-gray-400 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
              placeholder="e.g., 30"
              min="1"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tablets-per-day" className="block text-sm font-medium text-brand-gray-700">
            Tablets to Take Per Day
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="tablets-per-day"
              value={tabletsPerDay}
              onChange={(e) => setTabletsPerDay(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 rounded-md shadow-sm placeholder-brand-gray-400 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
              placeholder="e.g., 2"
              min="1"
            />
          </div>
        </div>

        <div>
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                <input
                    id="reminders-enabled"
                    name="reminders-enabled"
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="focus:ring-brand-gold-DEFAULT h-4 w-4 text-brand-gold-DEFAULT border-gray-300 rounded"
                />
                </div>
                <div className="ml-3 text-sm">
                <label htmlFor="reminders-enabled" className="font-medium text-gray-700">
                    Set Reminders
                </label>
                </div>
            </div>
        </div>

        {remindersEnabled && (
            <div className="p-4 border border-brand-gray-200 rounded-lg space-y-4 bg-brand-gold-light">
                {reminderTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-x-3">
                        <label htmlFor={`reminder-time-${index}`} className="sr-only">Reminder time {index+1}</label>
                        <input
                            id={`reminder-time-${index}`}
                            type="time"
                            value={time}
                            onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 rounded-md shadow-sm placeholder-brand-gray-400 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
                        />
                         <button type="button" onClick={() => handleRemoveReminder(index)} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 focus:outline-none" aria-label="Remove reminder time">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
                 {reminderTimes.length < perDayCount && (
                    <button type="button" onClick={handleAddReminder} className="w-full flex items-center justify-center gap-x-2 text-sm font-medium text-brand-gold-DEFAULT hover:text-brand-gold-dark py-2 px-3 border-2 border-dashed border-brand-gray-300 rounded-md hover:border-brand-gold-DEFAULT">
                        <BellIcon className="w-5 h-5" />
                        Add Reminder Time
                    </button>
                 )}
                 {perDayCount === 0 && <p className="text-xs text-brand-gray-500 text-center">Set 'Tablets to Take Per Day' to add reminders.</p>}
            </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div className="flex items-center justify-end space-x-4 pt-2">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-brand-gray-700 bg-white border border-brand-gray-300 rounded-md shadow-sm hover:bg-brand-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-gold-dark hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark"
            >
                {isEditMode ? <EditIcon className="w-5 h-5" /> : <PlusIcon className="h-5 w-5" />}
                {isEditMode ? 'Save Changes' : 'Add Medication'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddMedicationForm;