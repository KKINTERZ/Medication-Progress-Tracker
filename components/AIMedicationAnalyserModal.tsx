import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Medication } from '../types';
import { XIcon, SparklesIcon } from './Icons';

interface AIMedicationAnalyserModalProps {
  medications: Medication[];
  onClose: () => void;
}

const AIMedicationAnalyserModal: React.FC<AIMedicationAnalyserModalProps> = ({ medications, onClose }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const getAnalysis = async () => {
            if (medications.length === 0) {
                setAnalysis("You don't have any medications to analyze.");
                setIsLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const medicationNames = medications.map(m => m.name).join(', ');
                
                const systemInstruction = "You are a helpful medical information assistant. Your responses must be in plain text only. You MUST NOT use any markdown formatting such as asterisks, bolding, or headers (e.g., ###).";
                const prompt = `Provide an analysis for the following medications: ${medicationNames}.
Follow these instructions exactly:
1. Begin your response with this exact disclaimer, without any formatting: "This is an AI-generated analysis and not a substitute for professional medical advice. Always consult your doctor or pharmacist regarding your medications."
2. After the disclaimer, for each medication, provide a summary of its common use, typical side effects, and one key piece of advice.
3. Use simple line breaks to separate information. Do not use any markdown at all.`;


                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                     config: {
                        systemInstruction: systemInstruction,
                    }
                });
                setAnalysis(response.text);

            } catch (err) {
                console.error(err);
                setError('Could not retrieve AI analysis at this time. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        getAnalysis();
    }, [medications]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
                    <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">AI Medication Analysis</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT" aria-label="Close">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center py-10">
                            <SparklesIcon className="w-12 h-12 text-brand-gold-DEFAULT animate-pulse" />
                            <p className="mt-4 text-brand-gray-600 dark:text-brand-gray-400">Analyzing your medications...</p>
                        </div>
                    )}
                    {error && <p className="text-center text-red-600">{error}</p>}
                    {!isLoading && !error && (
                        <div className="text-sm text-brand-gray-700 dark:text-brand-gray-300 whitespace-pre-line">
                           {analysis}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIMedicationAnalyserModal;