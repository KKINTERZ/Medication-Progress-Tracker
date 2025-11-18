
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { XIcon, ScanIcon, SpinnerIcon, SparklesIcon, UploadIcon } from './Icons';

interface PrescriptionScannerProps {
  onClose: () => void;
  onScanComplete: (data: { name: string; totalTablets: number; dosesPerDay: number; tabletsPerDose: number; }) => void;
}

const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onClose, onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        // Only set error if we don't have a file selected
        if (!selectedFile) {
             setError("Could not access the camera. Please check your browser permissions.");
        }
      }
    };

    getCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null); // Clear any camera errors since we have a file
    }
  };

  const handleClearFile = () => {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // If camera permission failed previously, we might show error again, 
      // or ideally we try to restart camera, but simplistic approach is fine:
      // If camera stream exists, it will just show. 
      // If it failed initially, the error message will be visible again if we didn't clear it in state completely.
      // But we cleared it. So if stream is null, user will see just blank or spinner.
      // Let's re-check permissions if needed, but mostly stream is kept alive in background.
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
        let blob: Blob | null = null;

        if (selectedFile) {
            blob = selectedFile;
        } else {
            if (!videoRef.current || !canvasRef.current) {
                throw new Error("Camera not ready");
            }
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) throw new Error("Could not get canvas context");
            
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        }

        if (!blob) throw new Error("Failed to get image data");

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

        {/* Camera View / Image Preview */}
        <div className="relative aspect-video bg-black">
            {previewUrl ? (
                 <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
            ) : (
                <>
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
                </>
            )}
        </div>

        {/* Footer & Controls */}
        <div className="p-4 bg-brand-gray-800/50">
          {error && <p className="text-sm text-red-400 text-center mb-3">{error}</p>}
          <p className="text-sm text-brand-gray-400 text-center mb-4">
              {selectedFile ? "Review the image and analyze." : "Position the medication label inside the frame and capture."}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
             {selectedFile ? (
                 <button
                    onClick={handleClearFile}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-brand-gray-600 text-base font-medium rounded-lg shadow-sm text-brand-gray-300 hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-600 transition-all"
                 >
                    Retake Photo
                 </button>
             ) : (
                 <button
                    onClick={triggerFileUpload}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-brand-gray-600 text-base font-medium rounded-lg shadow-sm text-brand-gray-300 hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-600 transition-all"
                 >
                    <UploadIcon className="w-5 h-5" />
                    Upload
                 </button>
             )}

            <button
                onClick={handleAnalyze}
                disabled={isLoading || (!cameraReady && !selectedFile)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark transition-all duration-300 transform hover:scale-105 disabled:bg-brand-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                <>
                    <SpinnerIcon className="w-5 h-5 animate-spin"/>
                    <span>Analyzing...</span>
                </>
                ) : (
                <>
                    {selectedFile ? <SparklesIcon className="w-5 h-5"/> : <ScanIcon className="w-5 h-5" />}
                    <span>{selectedFile ? "Analyze" : "Capture"}</span>
                </>
                )}
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};

export default PrescriptionScanner;
