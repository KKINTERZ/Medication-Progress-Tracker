
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { XIcon, LightBulbIcon, SpinnerIcon } from './Icons';
import { Medication } from '../types';

interface AIMedicationAnalyserModalProps {
  medications: Medication[];
  onClose: () => void;
}

const AIMedicationAnalyserModal: React.FC<AIMedicationAnalyserModalProps> = ({ medications, onClose }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeMedications = async () => {
      if (medications.length === 0) {
        setAnalysis("You haven't added any medications yet. Add some medications to your list to get an analysis.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const medicationList = medications.map(m => `${m.name} (${m.dosesPerDay} times/day)`).join(', ');
        
        const prompt = `Analyze the following list of medications for a patient: ${medicationList}. 
        
        Please provide:
        1. MEDICATION USES: Briefly explain what each medication is commonly used for.
        2. POTENTIAL INTERACTIONS: Identify potential interactions between them (if any).
        3. GENERAL ADVICE: Provide general advice for taking these medications (e.g., with food, time of day).

        STRICT FORMATTING RULES:
        - Do NOT use markdown characters like *, **, or ###.
        - Do NOT use bullet points.
        - Write all section headings in UPPERCASE letters.
        - Output purely plain text.
        
        Start by stating this is AI-generated advice and not a substitute for professional medical consultation.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        setAnalysis(response.text || 'Could not generate analysis.');
      } catch (err) {
        console.error("AI Analysis failed:", err);
        setError("Failed to analyze medications. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    analyzeMedications();
  }, [medications]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
        
        <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex items-center gap-x-3">
            <LightBulbIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
            <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">AI Medication Analysis</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SpinnerIcon className="w-12 h-12 text-brand-gold-DEFAULT animate-spin mb-4" />
              <p className="text-brand-gray-500 dark:text-brand-gray-400">Analyzing your medications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-brand-gray-200 dark:bg-brand-gray-700 rounded-md text-brand-gray-800 dark:text-brand-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-brand-gray-700 dark:text-brand-gray-300 leading-relaxed font-sans">
                {analysis}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-b-xl">
            <p className="text-xs text-center text-brand-gray-500 dark:text-brand-gray-400 italic">
                AI can make mistakes sometimes but our model is usually accurate
            </p>
        </div>
      </div>
    </div>
  );
};

export default AIMedicationAnalyserModal;
