import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { PillIcon, PlusIcon, XIcon, BellIcon, EditIcon, SparklesIcon } from './Icons';
import { GoogleGenAI, Type } from '@google/genai';

type PrefilledMedicationData = Omit<Medication, 'id' | 'startDate' | 'dosesTaken' | 'reminders'> & { reminders?: string[] };

interface AddMedicationFormProps {
  onSave: (data: Omit<Medication, 'id' | 'startDate' | 'dosesTaken'>, id?: string) => void;
  onCancel: () => void;
  medicationToEdit?: Medication | null;
  medicationNames: string[];
  prefilledData?: PrefilledMedicationData | null;
}

const AddMedicationForm: React.FC<AddMedicationFormProps> = ({ onSave, onCancel, medicationToEdit, medicationNames, prefilledData }) => {
  const [name, setName] = useState('');
  const [totalTablets, setTotalTablets] = useState('');
  const [dosesPerDay, setDosesPerDay] = useState('');
  const [tabletsPerDose, setTabletsPerDose] = useState('1');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
  const [error, setError] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isEditMode = !!medicationToEdit;
  const formDataSource = medicationToEdit || prefilledData;

  useEffect(() => {
    if (formDataSource) {
      setName(formDataSource.name);
      setTotalTablets(String(formDataSource.totalTablets));
      setDosesPerDay(String(formDataSource.dosesPerDay));
      setTabletsPerDose(String(formDataSource.tabletsPerDose || 1));
      const hasReminders = formDataSource.reminders && formDataSource.reminders.length > 0;
      setRemindersEnabled(hasReminders);
      setReminderTimes(hasReminders ? [...formDataSource.reminders!].sort() : ['09:00']);
    }
  }, [formDataSource]);

  const handleAddReminder = () => {
    setReminderTimes(times => [...times, '17:00'].sort());
  };

  const handleRemoveReminder = (index: number) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = value;
    setReminderTimes(newTimes);
  };
  
  const sortReminders = () => {
    setReminderTimes(times => [...times].sort());
  }
  
  const handleAIFill = async () => {
    if (!name.trim()) {
        setError("Please enter a medication name first.");
        return;
    }
    setIsAiLoading(true);
    setError('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the medication name "${name}", what is a common prescription? Provide the total number of tablets for a standard course, the number of doses per day, and tablets per dose.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalTablets: { type: Type.NUMBER },
                        dosesPerDay: { type: Type.NUMBER },
                        tabletsPerDose: { type: Type.NUMBER },
                    },
                     required: ["totalTablets", "dosesPerDay", "tabletsPerDose"],
                },
            },
        });
        const result = JSON.parse(response.text);
        setTotalTablets(String(result.totalTablets || ''));
        setDosesPerDay(String(result.dosesPerDay || ''));
        setTabletsPerDose(String(result.tabletsPerDose || '1'));

    } catch (err) {
        console.error(err);
        setError("Couldn't fetch AI suggestions. Please fill details manually.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(totalTablets, 10);
    const perDay = parseInt(dosesPerDay, 10);
    const perDose = parseInt(tabletsPerDose, 10);

    if (!name.trim() || !total || !perDay || !perDose) {
      setError('All fields are required and must be valid numbers.');
      return;
    }
    if (total <= 0 || perDay <= 0 || perDose <= 0) {
      setError('Tablet and dose counts must be greater than zero.');
      return;
    }
    if ((perDay * perDose) > total) {
      setError('Daily intake cannot exceed the total number of tablets.');
      return;
    }

    setError('');
    const sortedReminders = [...reminderTimes].sort();
    onSave({
      name,
      totalTablets: total,
      dosesPerDay: perDay,
      tabletsPerDose: perDose,
      reminders: remindersEnabled ? sortedReminders : [],
    }, medicationToEdit?.id);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">{isEditMode ? 'Edit Medication' : 'Add New Medication'}</h2>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">
            {isEditMode ? 'Update the details of your prescription.' : 'Enter the details of your prescription.'}
          </p>
        </div>
        <button onClick={onCancel} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT">
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
            Medication Name
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="name"
              list="medication-names"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
              placeholder="e.g., Vitamin D"
            />
            <datalist id="medication-names">
              {medicationNames.map((medName) => (
                <option key={medName} value={medName} />
              ))}
            </datalist>
             <button
                type="button"
                onClick={handleAIFill}
                disabled={isAiLoading}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-gold-dark dark:text-brand-gold-light hover:text-brand-success-dark disabled:text-brand-gray-400 disabled:cursor-wait"
                aria-label="Auto-fill with AI"
            >
                {isAiLoading ? <div className="w-5 h-5 border-2 border-brand-gray-300 border-t-brand-gold-dark rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
          <div className="sm:col-span-1">
            <label htmlFor="total-tablets" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
              Total Tablets
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="total-tablets"
                value={totalTablets}
                onChange={(e) => setTotalTablets(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
                placeholder="e.g., 30"
                min="1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="doses-per-day" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
              Doses Per Day
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="doses-per-day"
                value={dosesPerDay}
                onChange={(e) => setDosesPerDay(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
                placeholder="e.g., 2"
                min="1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tablets-per-dose" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
              Tablets Per Dose
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="tablets-per-dose"
                value={tabletsPerDose}
                onChange={(e) => setTabletsPerDose(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
                placeholder="e.g., 1"
                min="1"
              />
            </div>
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
                    className="focus:ring-brand-gold-DEFAULT h-4 w-4 text-brand-gold-DEFAULT border-gray-300 dark:border-gray-500 rounded"
                />
                </div>
                <div className="ml-3 text-sm">
                <label htmlFor="reminders-enabled" className="font-medium text-gray-700 dark:text-brand-gray-300">
                    Set Reminders
                </label>
                </div>
            </div>
        </div>

        {remindersEnabled && (
            <div className="p-4 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg space-y-4">
                {reminderTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-x-3">
                        <label htmlFor={`reminder-time-${index}`} className="sr-only">Reminder time {index+1}</label>
                        <input
                            id={`reminder-time-${index}`}
                            type="time"
                            value={time}
                            onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                            onBlur={sortReminders}
                            className="appearance-none block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT sm:text-sm"
                        />
                         <button type="button" onClick={() => handleRemoveReminder(index)} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none" aria-label="Remove reminder time">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddReminder}
                    className="w-full flex items-center justify-center gap-x-2 text-sm font-medium text-brand-gold-dark dark:text-brand-gold-light py-2 px-3 bg-brand-gold-50 dark:bg-brand-gray-700 border-2 border-dashed border-brand-gold/50 dark:border-brand-gray-600 rounded-md hover:border-brand-gold dark:hover:border-brand-gold-light hover:bg-brand-gold-light/50 dark:hover:bg-brand-gray-600/50 transition-colors"
                >
                    <BellIcon className="w-5 h-5" />
                    Add Reminder Time
                </button>
            </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div className="flex items-center justify-end space-x-4 pt-2">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT"
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