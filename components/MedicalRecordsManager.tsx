import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { storage, db, auth } from '../firebase';
import { MedicalFile } from '../types';
import { XIcon, DocumentTextIcon, CloudArrowUpIcon, TrashIcon, ArrowDownTrayIcon, SpinnerIcon, SparklesIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

interface MedicalRecordsManagerProps {
  onClose: () => void;
}

const MedicalRecordsManager: React.FC<MedicalRecordsManagerProps> = ({ onClose }) => {
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'files'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileList: MedicalFile[] = [];
      snapshot.forEach((doc) => {
        fileList.push({ id: doc.id, ...doc.data() } as MedicalFile);
      });
      setFiles(fileList);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
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

  const generateSummary = async (file: File): Promise<string | undefined> => {
    // Only try to summarize images for now using the Vision model approach
    if (!file.type.startsWith('image/')) return undefined;

    try {
      const base64Image = await blobToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      const imagePart = {
          inlineData: {
              mimeType: file.type,
              data: base64Image,
          },
      };

      const prompt = "Analyze this medical document/image. Provide a concise summary of its contents, key findings, or purpose. Format as plain text.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
      });

      return response.text;
    } catch (e) {
      console.error("Failed to generate summary", e);
      return undefined;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !auth.currentUser) return;

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload to Firebase Storage
      const storagePath = `userdata/${auth.currentUser.uid}/${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);

      // 2. Generate AI Summary (Optional)
      let aiSummary = undefined;
      if (selectedFile.type.startsWith('image/')) {
          aiSummary = await generateSummary(selectedFile);
      }

      // 3. Save Metadata to Firestore
      const newFile: Omit<MedicalFile, 'id'> = {
        name: selectedFile.name,
        url,
        storagePath,
        type: selectedFile.type,
        size: selectedFile.size,
        createdAt: new Date().toISOString(),
        notes: notes,
        aiSummary: aiSummary
      };

      await addDoc(collection(db, 'users', auth.currentUser.uid, 'files'), newFile);

      // Reset form
      setSelectedFile(null);
      setNotes('');
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadError(error.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: MedicalFile) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef).catch(err => {
          // Ignore if object not found (might have been deleted manually)
          console.warn("Could not delete from storage or already deleted", err);
      });

      // 2. Delete from Firestore
      if (auth.currentUser) {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'files', file.id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex items-center gap-x-3">
            <DocumentTextIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
            <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">Medical Records</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Upload Section */}
            <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-brand-gray-200 dark:border-brand-gray-700 overflow-y-auto bg-brand-gray-50 dark:bg-brand-gray-800/50">
                <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4">Upload New File</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-brand-gold-DEFAULT transition-colors bg-white dark:bg-brand-gray-800">
                        <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <CloudArrowUpIcon className="w-10 h-10 text-brand-gold-DEFAULT mb-2" />
                            <span className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                                {selectedFile ? selectedFile.name : "Click to select a file"}
                            </span>
                            {!selectedFile && (
                                <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                                    Images, PDFs, or Docs
                                </span>
                            )}
                        </label>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 sm:text-sm"
                            placeholder="Add details about this record..."
                        />
                    </div>

                    {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}

                    <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gold-dark hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload File"
                        )}
                    </button>
                </form>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        <span className="font-bold">AI Feature:</span> Uploading images (like prescriptions or lab results) will automatically generate a smart summary.
                    </p>
                </div>
            </div>

            {/* File List Section */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-white dark:bg-brand-gray-800">
                <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4">Your Files</h3>
                
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-brand-gray-400">
                        <DocumentTextIcon className="w-12 h-12 mb-2 opacity-50" />
                        <p>No records found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {files.map((file) => (
                            <div key={file.id} className="border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-brand-gray-50 dark:bg-brand-gray-800/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white dark:bg-brand-gray-700 rounded-lg border border-brand-gray-200 dark:border-brand-gray-600">
                                            <DocumentTextIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-brand-gray-900 dark:text-brand-gray-100 truncate max-w-[200px] sm:max-w-xs">
                                                {file.name}
                                            </h4>
                                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                                                {new Date(file.createdAt).toLocaleDateString()} • {formatSize(file.size)}
                                            </p>
                                            {file.notes && (
                                                <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300 mt-2 italic">
                                                    "{file.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={file.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 text-brand-gray-400 hover:text-brand-gold-DEFAULT hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 rounded-full transition-colors"
                                            title="Download"
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                        </a>
                                        <button 
                                            onClick={() => handleDelete(file)}
                                            className="p-2 text-brand-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {file.aiSummary && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <SparklesIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">AI Summary</span>
                                        </div>
                                        <p className="text-sm text-brand-gray-700 dark:text-brand-gray-300">
                                            {file.aiSummary}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsManager;