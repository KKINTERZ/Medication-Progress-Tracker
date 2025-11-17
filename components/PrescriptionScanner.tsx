import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { XIcon, ScanIcon, SpinnerIcon, SparklesIcon } from './Icons';

interface PrescriptionScannerProps {
  onClose: () => void;
  onScanComplete: (data: { name: string; totalTablets: number; dosesPerDay: number; tabletsPerDose: number; }) => void;
}

const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onClose, onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check your browser permissions.");
      }
    };

    getCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setError("Could not get canvas context.");
        setIsLoading(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to capture image from video.");
        setIsLoading(false);
        return;
      }

      try {
        const base64Image = await blobToBase64(blob);
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
            },
        };

        const textPart = {
            text: `Analyze this image of a medication label. Extract the following details: 
            1. 'name': The brand or generic name of the medication.
            2. 'totalTablets': The total quantity of tablets, capsules, or pills.
            3. 'dosesPerDay': How many times per day the medication should be taken.
            4. 'tabletsPerDose': How many tablets make up a single dose.
            If a value is not clearly present, provide a reasonable default or leave it as 0.
            Return the result ONLY in a valid JSON format according to the provided schema.`,
        };

        const schema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the medication" },
                totalTablets: { type: Type.NUMBER, description: "Total count of tablets in the prescription" },
                dosesPerDay: { type: Type.NUMBER, description: "Number of doses to be taken each day" },
                tabletsPerDose: { type: Type.NUMBER, description: "Number of tablets per single dose" },
            },
            required: ["name", "totalTablets", "dosesPerDay", "tabletsPerDose"]
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const result = JSON.parse(response.text);
        onScanComplete(result);

      } catch (e) {
        console.error("AI processing failed:", e);
        setError("Could not analyze the image. Please try again with a clearer picture.");
      } finally {
        setIsLoading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-brand-gray-800 rounded-xl shadow-2xl relative overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-brand-gray-700">
          <div className="flex items-center gap-x-2">
            <SparklesIcon className="w-6 h-6 text-brand-gold-light"/>
            <h2 className="text-lg font-bold text-brand-gray-100">AI Prescription Scanner</h2>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-700 disabled:opacity-50">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11/12 h-3/4 border-4 border-dashed border-white/50 rounded-lg" />
          </div>
          {!cameraReady && !error && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
              <SpinnerIcon className="w-8 h-8 animate-spin mr-3"/>
              Starting camera...
            </div>
          )}
        </div>

        {/* Footer & Controls */}
        <div className="p-4 bg-brand-gray-800/50">
          {error && <p className="text-sm text-red-400 text-center mb-3">{error}</p>}
          <p className="text-sm text-brand-gray-400 text-center mb-4">Position the medication label inside the frame and capture.</p>
          <button
            onClick={handleCapture}
            disabled={isLoading || !cameraReady}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark transition-all duration-300 transform hover:scale-105 disabled:bg-brand-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="w-5 h-5 animate-spin"/>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <ScanIcon className="h-6 w-6" />
                <span>Capture & Analyze</span>
              </>
            )}
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PrescriptionScanner;
