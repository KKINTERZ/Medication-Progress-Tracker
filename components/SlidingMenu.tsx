import React from 'react';
import { XIcon, ScanIcon, SparklesIcon, LogoutIcon, SwitchAccountIcon, LightBulbIcon, UserIcon, ChatBubbleIcon, GlobeIcon, MapPinIcon, ClipboardIcon, DocumentTextIcon } from './Icons';
import Logo from './Logo';
import { UserProfile } from '../types';

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoLoggingEnabled: boolean;
  onAutoLoggingToggle: (enabled: boolean) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenScanner: () => void;
  onOpenAnalyser: () => void;
  onOpenMedicalRecords: () => void;
}

const SlidingMenu: React.FC<SlidingMenuProps> = ({ 
  isOpen, onClose, isAutoLoggingEnabled, onAutoLoggingToggle, user, onLogout, onOpenScanner, onOpenAnalyser, onOpenMedicalRecords
}) => {
  
  const handleLogoutAndClose = () => {
    onLogout();
    onClose();
  };
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <div 
        className={`fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-brand-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
            <div className="flex items-center gap-x-2">
              <Logo className="w-6 h-6" />
              <h2 id="menu-title" className="text-lg font-bold text-brand-gray-900 dark:text-brand-gray-100">
                Explore More from MPT
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
              aria-label="Close menu"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
            <div className="p-3 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                  <SparklesIcon className="w-6 h-6 text-brand-gold-DEFAULT" />
                  <div>
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">Auto-Log Doses</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Log doses at reminder times.</p>
                  </div>
                </div>
                <label htmlFor="auto-log-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="auto-log-toggle" 
                    className="sr-only peer" 
                    checked={isAutoLoggingEnabled}
                    onChange={(e) => onAutoLoggingToggle(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-brand-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-gold-DEFAULT dark:peer-focus:ring-brand-gold-dark rounded-full peer dark:bg-brand-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-brand-gray-500 peer-checked:bg-brand-gold-DEFAULT"></div>
                </label>
              </div>
            </div>

            <a href="#" onClick={(e) => { e.preventDefault(); onOpenScanner(); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors group">
              <div className="flex items-center gap-x-3">
                <ScanIcon className="w-6 h-6 text-brand-gold-DEFAULT group-hover:text-brand-gold-dark dark:group-hover:text-brand-gold-light transition-colors" />
                <span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">AI Prescription Scanner</span>
              </div>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAnalyser(); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors group">
              <div className="flex items-center gap-x-3">
                <LightBulbIcon className="w-6 h-6 text-brand-gold-DEFAULT group-hover:text-brand-gold-dark dark:group-hover:text-brand-gold-light transition-colors" />
                <span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">AI Medication Analyser</span>
              </div>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); onOpenMedicalRecords(); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors group">
              <div className="flex items-center gap-x-3">
                <DocumentTextIcon className="w-6 h-6 text-brand-gold-DEFAULT group-hover:text-brand-gold-dark dark:group-hover:text-brand-gold-light transition-colors" />
                <span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">Medical Records</span>
              </div>
            </a>

            <div className="my-4 border-t border-brand-gray-200 dark:border-brand-gray-700 mx-1"></div>
            <p className="px-3 text-xs font-bold text-brand-gray-400 dark:text-brand-gray-500 uppercase tracking-wider mb-2">
              Coming Soon
            </p>

            <div className="flex items-center justify-between p-3 rounded-lg opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-x-3">
                <ChatBubbleIcon className="w-6 h-6 text-brand-gray-400 dark:text-brand-gray-500" />
                <span className="font-semibold text-brand-gray-500 dark:text-brand-gray-400">AI Medical Advisor</span>
              </div>
              <span className="text-[10px] font-bold bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-500 px-2 py-0.5 rounded-full border border-brand-gray-200 dark:border-brand-gray-600">Soon</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-x-3">
                <GlobeIcon className="w-6 h-6 text-brand-gray-400 dark:text-brand-gray-500" />
                <span className="font-semibold text-brand-gray-500 dark:text-brand-gray-400">AI Health Research</span>
              </div>
              <span className="text-[10px] font-bold bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-500 px-2 py-0.5 rounded-full border border-brand-gray-200 dark:border-brand-gray-600">Soon</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-x-3">
                <MapPinIcon className="w-6 h-6 text-brand-gray-400 dark:text-brand-gray-500" />
                <span className="font-semibold text-brand-gray-500 dark:text-brand-gray-400">Smart Pharmacy Locator</span>
              </div>
              <span className="text-[10px] font-bold bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-500 px-2 py-0.5 rounded-full border border-brand-gray-200 dark:border-brand-gray-600">Soon</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-x-3">
                <ClipboardIcon className="w-6 h-6 text-brand-gray-400 dark:text-brand-gray-500" />
                <span className="font-semibold text-brand-gray-500 dark:text-brand-gray-400">Symptom & Mood Log</span>
              </div>
              <span className="text-[10px] font-bold bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-500 px-2 py-0.5 rounded-full border border-brand-gray-200 dark:border-brand-gray-600">Soon</span>
            </div>
          </nav>

          <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
            <div>
              <div className="flex items-center gap-x-3">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-gold-light dark:bg-brand-gray-700 flex items-center justify-center border border-brand-gold-DEFAULT/30">
                        <UserIcon className="w-6 h-6 text-brand-gold-dark dark:text-brand-gold-light" />
                    </div>
                  )}
                <div className="min-w-0">
                  <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate">{user.name}</p>
                  <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <button
                  onClick={handleLogoutAndClose}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 flex items-center gap-x-3 rounded-md transition-colors"
                >
                  <SwitchAccountIcon className="w-5 h-5" />
                  <span>Switch Account</span>
                </button>
                <button
                  onClick={handleLogoutAndClose}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-x-3 rounded-md transition-colors"
                >
                  <LogoutIcon className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlidingMenu;