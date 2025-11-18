
import React, { useState, useEffect, useMemo } from 'react';
import { Medication, UserProfile } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import AddMedicationForm from './components/AddMedicationForm';
import MedicationList from './components/MedicationList';
import { LogoIcon, PlusIcon, MenuIcon, SunIcon, MoonIcon } from './components/Icons';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import MedicationHistoryModal from './components/MedicationHistoryModal';
import { useTheme } from './hooks/useTheme';
import UserProfileDisplay from './components/UserProfile';
import SlidingMenu from './components/SlidingMenu';
import AIMedicationAnalyserModal from './components/AIMedicationAnalyserModal';
import AIPrescriptionReaderModal from './components/AIPrescriptionReaderModal';
import RealTimeClock from './components/RealTimeClock';
import AuthModal from './components/AuthModal';

type PrefilledMedicationData = Omit<Medication, 'id' | 'startDate' | 'dosesTaken' | 'reminders'> & { reminders?: string[] };

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLoginClick, onSignUpClick }) => (
  <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <LogoIcon className="mx-auto h-16 w-16"/>
    <h3 className="mt-4 text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">
      Welcome to Medication Progress Tracker by{' '}
      <span className="font-bold italic text-brand-gold-dark dark:text-brand-gold-light">
        KK Interz
      </span>{' '}
      from{' '}
      <span className="font-bold font-mono text-brand-gray-900 dark:text-brand-gray-50 tracking-widest">
        DMW
      </span>
    </h3>
    <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">
      Log in or create an account to track your medications.
    </p>
    <div className="mt-8 flex justify-center gap-x-4">
      <button
        onClick={onLoginClick}
        className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark transition-all duration-300 transform hover:scale-105"
      >
        Log In
      </button>
      <button
        onClick={onSignUpClick}
        className="inline-flex items-center gap-2 px-6 py-3 border border-brand-gray-300 dark:border-brand-gray-600 text-base font-medium rounded-full shadow-sm text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT transition-all duration-300 transform hover:scale-105"
      >
        Sign Up
      </button>
    </div>
  </div>
);

function App() {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', [], userProfile?.id);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [historyMedication, setHistoryMedication] = useState<Medication | null>(null);
  const [prefilledData, setPrefilledData] = useState<PrefilledMedicationData | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({ isOpen: false, mode: 'login' });

  const { theme, toggleTheme } = useTheme();

  // AI Features State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnalyserOpen, setIsAnalyserOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [autoDoseLog, setAutoDoseLog] = useLocalStorage('autoDoseLog', false, userProfile?.id);


  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAuthSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setAuthModal({ isOpen: false, mode: 'login' });
  };
  
  const handleLogout = () => {
    setUserProfile(null);
  };

  // Run the notification scheduler
  useNotificationScheduler(medications);

  const uniqueMedicationNames = useMemo(() => {
    return [...new Set(medications.map(med => med.name.trim()).filter(Boolean))].sort();
  }, [medications]);

  const handleAddNewClick = () => {
    setEditingMedication(null);
    setPrefilledData(null);
    setIsFormVisible(true);
  };
  
  const handleEditClick = (med: Medication) => {
    setEditingMedication(med);
    setPrefilledData(null);
    setIsFormVisible(true);
  };
  
  const handleReaderSave = (data: PrefilledMedicationData) => {
    setPrefilledData(data);
    setIsReaderOpen(false);
    setIsFormVisible(true);
    setEditingMedication(null);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingMedication(null);
    setPrefilledData(null);
  };

  const handleSaveMedication = (data: Omit<Medication, 'id' | 'startDate' | 'dosesTaken'>, id?: string) => {
    if (id) {
      // Update existing medication
      setMedications(meds => meds.map(med => med.id === id ? { ...med, ...data } : med));
    } else {
      // Add new medication
      const newMedication: Medication = {
        ...data,
        id: crypto.randomUUID(),
        startDate: new Date().toISOString(),
        dosesTaken: {},
      };
      setMedications(meds => [...meds, newMedication]);
    }
    handleCancelForm();
  };

  const handleUpdateMedication = (updatedMedication: Medication) => {
    setMedications(meds => meds.map(med => med.id === updatedMedication.id ? updatedMedication : med));
  };

  const deleteMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleShowHistory = (med: Medication) => {
    setHistoryMedication(med);
  };

  const handleCloseHistory = () => {
    setHistoryMedication(null);
  };

  return (
    <div className="min-h-screen bg-brand-gold-50 dark:bg-brand-gray-900 text-brand-gray-800 dark:text-brand-gray-200 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-brand-gray-800 shadow-sm dark:shadow-none dark:border-b dark:border-brand-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 flex-1 basis-0">
             {userProfile && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
                aria-label="Open AI Features Menu"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            <LogoIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-brand-gold via-brand-gold-dark to-brand-gold-light bg-200% animate-gradient-shift bg-clip-text text-transparent">
              Medication Progress Tracker
            </h1>
          </div>
          
          <div className="hidden md:flex justify-center flex-shrink-0 mx-4">
             {userProfile && <RealTimeClock />}
          </div>

          <div className="flex items-center space-x-4 flex-1 basis-0 justify-end">
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? (
                    <MoonIcon key="moon" className="h-6 w-6 animate-theme-icon-spin" />
                ) : (
                    <SunIcon key="sun" className="h-6 w-6 animate-theme-icon-spin" />
                )}
            </button>
            {userProfile ? (
              <UserProfileDisplay user={userProfile} onLogout={handleLogout} />
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                  className="px-4 py-2 text-sm font-medium text-brand-gold-dark dark:text-brand-gold-light hover:bg-brand-gold-50 dark:hover:bg-brand-gray-700 rounded-md"
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-gold-dark hover:bg-brand-success-dark rounded-md shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
        
      {userProfile && (
        <>
            <SlidingMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                isAutoLogEnabled={autoDoseLog}
                onAutoLogToggle={setAutoDoseLog}
                onAnalyserOpen={() => setIsAnalyserOpen(true)}
                onReaderOpen={() => setIsReaderOpen(true)}
            />
            {isAnalyserOpen && (
                <AIMedicationAnalyserModal
                    medications={medications}
                    onClose={() => setIsAnalyserOpen(false)}
                />
            )}
            {isReaderOpen && (
                <AIPrescriptionReaderModal
                    onClose={() => setIsReaderOpen(false)}
                    onSave={handleReaderSave}
                />
            )}
        </>
       )}
      
      {authModal.isOpen && (
        <AuthModal
          mode={authModal.mode}
          onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!userProfile ? (
          <WelcomeScreen 
            onLoginClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
            onSignUpClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
          />
        ) : (
          <>
            {isFormVisible && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4" onClick={handleCancelForm}>
                <div onClick={(e) => e.stopPropagation()}>
                  <AddMedicationForm 
                    onSave={handleSaveMedication} 
                    onCancel={handleCancelForm}
                    medicationToEdit={editingMedication}
                    medicationNames={uniqueMedicationNames}
                    prefilledData={prefilledData}
                  />
                </div>
              </div>
            )}

            {historyMedication && (
              <MedicationHistoryModal 
                medication={historyMedication} 
                onClose={handleCloseHistory} 
              />
            )}
            
            <MedicationList
              medications={medications}
              onDeleteMedication={deleteMedication}
              onEditMedication={handleEditClick}
              onUpdateMedication={handleUpdateMedication}
              onShowHistory={handleShowHistory}
            />

            {medications.length === 0 && !isFormVisible && (
              <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
                <LogoIcon className="mx-auto h-16 w-16"/>
                <h3 className="mt-4 text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">No Medications Added Yet</h3>
                <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">
                  Click the 'Add New Medication' button to start tracking.
                </p>
                <button
                  onClick={handleAddNewClick}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-brand-gold/50 hover:bg-gradient-to-br from-brand-gold via-brand-gold-dark to-brand-success-dark"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add First Medication
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {userProfile && (
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={handleAddNewClick}
            disabled={isFormVisible}
            className={`flex items-center justify-center w-16 h-16 bg-brand-gold-dark text-white rounded-full shadow-lg transition-all duration-300 ${
              isFormVisible
                ? 'opacity-50 cursor-not-allowed'
                : 'transform hover:scale-110 hover:shadow-xl hover:shadow-brand-gold/50 hover:bg-gradient-to-br from-brand-gold via-brand-gold-dark to-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark'
            }`}
            aria-label="Add new medication"
          >
            <PlusIcon className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;