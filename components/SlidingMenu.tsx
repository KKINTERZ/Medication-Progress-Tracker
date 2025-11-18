import React from 'react';
import { SparklesIcon, XIcon } from './Icons';

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoLogEnabled: boolean;
  onAutoLogToggle: (enabled: boolean) => void;
  onReaderOpen: () => void;
  onAnalyserOpen: () => void;
}

const SlidingMenu: React.FC<SlidingMenuProps> = ({
  isOpen,
  onClose,
  isAutoLogEnabled,
  onAutoLogToggle,
  onReaderOpen,
  onAnalyserOpen,
}) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white dark:bg-brand-gray-800 shadow-2xl z-50 transform transition-transform ease-in-out duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
            <h2 id="menu-title" className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
                AI Features
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
              aria-label="Close menu"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-brand-gold-50 dark:bg-brand-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">Auto Dose Logging</h3>
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Enable smart suggestions for logging missed doses.</p>
                    </div>
                    <button
                        role="switch"
                        aria-checked={isAutoLogEnabled}
                        onClick={() => onAutoLogToggle(!isAutoLogEnabled)}
                        className={`${
                        isAutoLogEnabled ? 'bg-brand-gold-dark' : 'bg-brand-gray-300 dark:bg-brand-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold-dark focus:ring-offset-2`}
                    >
                        <span className={`${
                            isAutoLogEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                </div>
            </div>

            <button
                onClick={() => { onReaderOpen(); onClose(); }}
                className="w-full text-left p-4 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors"
            >
                <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">AI Prescription Reader</h3>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                    Upload a photo of your prescription to add a new medication automatically.
                </p>
            </button>

             <button
                onClick={() => { onAnalyserOpen(); onClose(); }}
                className="w-full text-left p-4 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors"
            >
                <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">AI Medication Analyser</h3>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                    Get an AI-generated analysis of your current medication list.
                </p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlidingMenu;
