
import React, { useState, useEffect, useMemo } from 'react';
import { Medication, UserProfile } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import AddMedicationForm from './components/AddMedicationForm';
import MedicationList from './components/MedicationList';
import { PlusIcon, SunIcon, MoonIcon, MenuIcon } from './components/Icons';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import MedicationHistoryModal from './components/MedicationHistoryModal';
import { useTheme } from './hooks/useTheme';
import UserProfileDisplay from './components/UserProfile';
import RealTimeClock from './components/RealTimeClock';
import SlidingMenu from './components/SlidingMenu';
import Logo from './components/Logo';
import PrescriptionScanner from './components/PrescriptionScanner';
import AIMedicationAnalyserModal from './components/AIMedicationAnalyserModal';
import AuthModal from './components/AuthModal';

type ScannedMedicationData = {
  name: string;
  totalTablets: number;
  dosesPerDay: number;
  tabletsPerDose: number;
};

interface LoginPromptProps {
    onLoginClick: () => void;
    onSignupClick: () => void;
    onGoogleLoginClick: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginClick, onSignupClick, onGoogleLoginClick }) => (
  <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 animate-fade-in-up">
    <Logo className="mx-auto h-20 w-20 opacity-30 dark:opacity-50"/>
    <h3 className="mt-4 text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">
      Welcome to Medication Progress Tracker by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold italic">KK Interz</span> from <span className="font-mono font-bold tracking-widest text-brand-gray-700 dark:text-brand-gray-300">DMW</span>
    </h3>
    <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">
      Please sign in or create an account to continue.
    </p>
    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button 
            onClick={onLoginClick}
            className="px-8 py-3 bg-brand-gold-dark hover:bg-brand-success-dark text-white rounded-full font-medium shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT"
        >
            Log In
        </button>
        <button 
            onClick={onSignupClick}
            className="px-8 py-3 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 text-brand-gray-700 dark:text-brand-gray-200 rounded-full font-medium shadow-sm hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT"
        >
            Create Account
        </button>
    </div>
    
    <div className="mt-8 max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-gray-200 dark:border-brand-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-brand-gray-800 text-brand-gray-500 dark:text-brand-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
          <button
            onClick={onGoogleLoginClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-full shadow-sm bg-white dark:bg-brand-gray-700 text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-DEFAULT transition-all transform hover:scale-105"
          >
            <img 
                src="https://iili.io/fduVidb.png" 
                alt="Google" 
                className="w-5 h-5"
                onError={(e) => {
                    e.currentTarget.src = "https://www.svgrepo.com/show/475656/google-color.svg";
                }}
            />
            <span className="font-medium">Sign in with Google</span>
          </button>
      </div>
    </div>
  </div>
);

function App() {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('currentUser', null);
  const [users, setUsers] = useLocalStorage<UserProfile[]>('users_db', []); // Simulated User DB
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', [], userProfile?.id);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [historyMedication, setHistoryMedication] = useState<Medication | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAutoLoggingEnabled, setIsAutoLoggingEnabled] = useLocalStorage<boolean>('autoLoggingEnabled', false, userProfile?.id);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isAnalyserVisible, setIsAnalyserVisible] = useState(false);
  const [prefilledData, setPrefilledData] = useState<ScannedMedicationData | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleOpenLogin = () => {
      setAuthMode('login');
      setIsAuthModalOpen(true);
  };

  const handleOpenSignup = () => {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
  };

  const handleAuth = async (email: string, name?: string) => {
      if (authMode === 'signup') {
        // Check if user exists
        if (users.some(u => u.email === email)) {
            throw new Error('User already exists with this email.');
        }
        const newUser: UserProfile = {
            id: crypto.randomUUID(),
            name: name || email.split('@')[0],
            email: email,
        };
        setUsers([...users, newUser]);
        setUserProfile(newUser);
      } else {
        // Login
        const user = users.find(u => u.email === email);
        if (!user) {
            // For simplicity in this demo, allow "login" if user not found but email is valid,
            // effectively treating it as a lazy signup or just mocking a successful login.
            // BUT, let's be strict to simulate real app:
            throw new Error('User not found. Please create an account.');
        }
        setUserProfile(user);
      }
      setIsAuthModalOpen(false);
  };

  const handleGoogleLogin = async () => {
    // Simulate a brief network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const googleUser: UserProfile = {
        id: 'google-' + crypto.randomUUID(),
        name: 'Google User',
        email: 'google.user@example.com',
        picture: 'https://lh3.googleusercontent.com/a/ACg8ocIq8dDBwpP1FfJ6q5sW8X1_9j7k2b4w5y8z7x9A=s96-c', // Standard Google generic avatar
    };
    setUserProfile(googleUser);
    setIsAuthModalOpen(false);
  };

  const handleResetPassword = async (email: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Password reset request for: ${email}`);
  };

  const handleLogout = () => {
    setUserProfile(null);
  };
  
  const handleAutoLogDose = (medicationId: string, newDosesTaken: Record<string, number>) => {
    setMedications(meds =>
      meds.map(med =>
        med.id === medicationId ? { ...med, dosesTaken: newDosesTaken } : med
      )
    );
  };

  // Run the notification scheduler
  useNotificationScheduler(medications, handleAutoLogDose, isAutoLoggingEnabled);

  const uniqueMedicationNames = useMemo<string[]>(() => {
    return Array.from<string>(new Set(medications.map(med => med.name.trim()).filter((n) => n.length > 0))).sort();
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
  
  const handleOpenScanner = () => {
    setIsMenuOpen(false); // Close menu
    setIsScannerVisible(true);
  };

  const handleOpenAnalyser = () => {
    setIsMenuOpen(false);
    setIsAnalyserVisible(true);
  };

  const handleScanComplete = (data: ScannedMedicationData) => {
    setPrefilledData(data);
    setEditingMedication(null);
    setIsScannerVisible(false);
    setIsFormVisible(true);
  };

  return (
    <div className="min-h-screen bg-brand-gold-50 dark:bg-brand-gray-900 text-brand-gray-800 dark:text-brand-gray-200 font-sans transition-colors duration-300">
      {userProfile && (
        <SlidingMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isAutoLoggingEnabled={isAutoLoggingEnabled}
          onAutoLoggingToggle={setIsAutoLoggingEnabled}
          user={userProfile}
          onLogout={handleLogout}
          onOpenScanner={handleOpenScanner}
          onOpenAnalyser={handleOpenAnalyser}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleAuth}
        onGoogleLogin={handleGoogleLogin}
        onResetPassword={handleResetPassword}
        initialMode={authMode}
      />

      <header className="bg-white dark:bg-brand-gray-800 shadow-sm dark:shadow-none dark:border-b dark:border-brand-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
             {userProfile && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-gray-800 focus:ring-brand-gold-DEFAULT"
                aria-label="Open menu"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
             )}
            <Logo className="h-8 w-8 hidden sm:block" />
          </div>

          {/* Center Section (Responsive) */}
          <div className="flex-1 min-w-0 px-2 text-center flex flex-col items-center justify-center">
             <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight truncate animate-gradient-shift bg-gradient-to-r from-brand-gold-dark via-brand-gold-DEFAULT to-brand-gold-light bg-[length:200%_auto] text-transparent bg-clip-text drop-shadow-sm pb-1">
                Medication Progress Tracker
              </h1>
             <div className="hidden sm:block -mt-1">
              {userProfile && <RealTimeClock />}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-gray-800 focus:ring-brand-gold-DEFAULT"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
            <UserProfileDisplay
              user={userProfile}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!userProfile ? (
          <LoginPrompt 
            onLoginClick={handleOpenLogin} 
            onSignupClick={handleOpenSignup} 
            onGoogleLoginClick={handleGoogleLogin}
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
                    initialData={prefilledData}
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
            
            {isScannerVisible && (
                <PrescriptionScanner
                    onClose={() => setIsScannerVisible(false)}
                    onScanComplete={handleScanComplete}
                />
            )}

            {isAnalyserVisible && (
                <AIMedicationAnalyserModal
                    medications={medications}
                    onClose={() => setIsAnalyserVisible(false)}
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
              <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 animate-fade-in-up">
                <Logo className="mx-auto h-20 w-20 opacity-30 dark:opacity-50"/>
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
