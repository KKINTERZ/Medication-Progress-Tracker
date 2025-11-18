import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { XIcon, SparklesIcon } from './Icons';

type ExtractedMedicationData = {
    name: string;
    totalTablets: number;
    dosesPerDay: number;
    tabletsPerDose: number;
};

interface AIPrescriptionReaderModalProps {
  onClose: () => void;
  onSave: (data: ExtractedMedicationData) => void;
}

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const AIPrescriptionReaderModal: React.FC<AIPrescriptionReaderModalProps> = ({ onClose, onSave }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile) {
            setError('Please select an image first.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const imagePart = await fileToGenerativePart(imageFile);
            
            const systemInstruction = "You are a highly accurate optical character recognition (OCR) and data extraction AI. Your sole purpose is to analyze images of medical prescriptions and extract specific data points into a structured JSON format. Be precise and do not infer information that is not explicitly present in the image.";
            const textPrompt = `You are an expert OCR system for medical prescriptions. Analyze the image and extract the following information into a strict JSON format.
Your task is to extract:
1. 'name': The full name of the medication.
2. 'totalTablets': The total quantity (often labeled as QTY or Quantity).
3. 'dosesPerDay': How many times per day to take it (e.g., 'twice daily' is 2).
4. 'tabletsPerDose': How many tablets are in a single dose (e.g., 'take one tablet' is 1).

Here is an example of how to process the text you might see:
---
EXAMPLE START
[Text found in image]: "TAKE ONE TABLET BY MOUTH TWICE DAILY. AMOXICILLIN 500MG. QTY: #30"
[Your JSON output]:
{
  "name": "Amoxicillin 500mg",
  "totalTablets": 30,
  "dosesPerDay": 2,
  "tabletsPerDose": 1
}
EXAMPLE END
---

Now, analyze the provided image and produce the JSON output. If a value is not found, use 0 for numbers and an empty string for the name. Do not add any text outside the JSON object.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { 
                    parts: [
                        { text: textPrompt },
                        imagePart,
                    ],
                },
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            totalTablets: { type: Type.NUMBER },
                            dosesPerDay: { type: Type.NUMBER },
                            tabletsPerDose: { type: Type.NUMBER },
                        },
                        required: ["name", "totalTablets", "dosesPerDay", "tabletsPerDose"],
                    },
                },
            });
            
            const parsedData = JSON.parse(response.text);
            onSave(parsedData);

        } catch (err) {
            console.error(err);
            setError('Failed to analyze prescription. Please try a clearer image or enter details manually.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
                    <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">AI Prescription Reader</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT" aria-label="Close">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-4">
                        Upload a clear photo of your prescription label or medication bottle to automatically fill in the details.
                    </p>
                    <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 px-6 py-10">
                        <div className="text-center">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Prescription preview" className="mx-auto h-32 w-auto object-contain" />
                            ) : (
                                <SparklesIcon className="mx-auto h-12 w-12 text-brand-gray-400" aria-hidden="true" />
                            )}
                            <div className="mt-4 flex text-sm justify-center text-brand-gray-600 dark:text-brand-gray-300">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-brand-gray-800 font-semibold text-brand-gold-dark dark:text-brand-gold-light focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-gold-DEFAULT focus-within:ring-offset-2 dark:focus-within:ring-offset-brand-gray-800 hover:text-brand-success-dark">
                                    <span>{imageFile ? 'Change image' : 'Upload an image'}</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>

                    {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}

                    <div className="mt-8 flex justify-end gap-x-4">
                         <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={!imageFile || isLoading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-gold-dark hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark disabled:bg-brand-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Analyzing...' : <><SparklesIcon className="w-5 h-5" /> Analyze Prescription</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPrescriptionReaderModal;