import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Medication, UserProfile } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import AddMedicationForm from './components/AddMedicationForm';
import MedicationList from './components/MedicationList';
import { PlusIcon, SunIcon, MoonIcon, MenuIcon, SpinnerIcon } from './components/Icons';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import MedicationHistoryModal from './components/MedicationHistoryModal';
import { useTheme } from './hooks/useTheme';
import { jwtDecode } from 'jwt-decode';
import UserProfileDisplay from './components/UserProfile';
import RealTimeClock from './components/RealTimeClock';
import { GOOGLE_CLIENT_ID } from './config';
import SlidingMenu from './components/SlidingMenu';
import Logo from './components/Logo';
import PrescriptionScanner from './components/PrescriptionScanner';
import { upsertUserAndGetMeds, saveMedicationsForUser } from './server/api';

// FIX: Replaced the incomplete global type for 'google' with a more specific one
// to resolve TypeScript errors. This definition makes the 'google' object and its
// nested properties and types available globally.
declare global {
  namespace google {
    interface CredentialResponse {
      credential: string;
    }
    const accounts: {
      id: {
        initialize(config: {
          client_id: string;
          callback: (response: CredentialResponse) => void;
          auto_select?: boolean;
          use_fedcm_for_prompt?: boolean; // Added this optional property
        }): void;
        renderButton(
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_black';
            // FIX: Expanded the 'size' property to include all valid options ('large', 'medium', 'small')
            // to match the Google Identity Services API and resolve the type error.
            size?: 'large' | 'medium' | 'small';
            type?: 'standard';
            text?: 'signin_with';
            [key: string]: unknown;
          }
        ): void;
        prompt(notification?: (notification: unknown) => void): void;
        disableAutoSelect(): void;
      };
    };
  }
  interface Window {
    google?: typeof google;
  }
}

type ScannedMedicationData = {
  name: string;
  totalTablets: number;
  dosesPerDay: number;
  tabletsPerDose: number;
};

const LoginPrompt: React.FC = () => (
  <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <Logo className="mx-auto h-20 w-20 opacity-30 dark:opacity-50"/>
    <h3 className="mt-4 text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">Welcome to Medication Progress Tracker by KK Interz from DMW</h3>
    <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">
      Please sign in with your Google account to continue.
    </p>
    <div id="google-signin-button-container" className="mt-6 flex justify-center"></div>
  </div>
);

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [historyMedication, setHistoryMedication] = useState<Medication | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAutoLoggingEnabled, setIsAutoLoggingEnabled] = useLocalStorage<boolean>('autoLoggingEnabled', false, userProfile?.id);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefilledData, setPrefilledData] = useState<ScannedMedicationData | null>(null);
  const isInitialLoad = useRef(true);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const handleLoginSuccess = async (credentialResponse: google.CredentialResponse) => {
    setIsLoading(true);
    const decoded: { sub: string, name: string, email: string, picture: string } = jwtDecode(credentialResponse.credential);
    const profile: UserProfile = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
    };
    
    const { user, medications: savedMedications } = await upsertUserAndGetMeds(profile);
    
    setUserProfile(user);
    setMedications(savedMedications);
    isInitialLoad.current = true; // Flag to prevent saving on initial load
    setIsLoading(false);
  };

  useEffect(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleLoginSuccess,
        auto_select: true,
        use_fedcm_for_prompt: false, 
      });

      // If the user is not logged in, show prompts and buttons.
      if (!userProfile) {
        // Trigger the One Tap prompt for returning users.
        window.google.accounts.id.prompt();
        
        // Also render the manual sign-in button in case One Tap is closed or fails.
        const googleButtonContainer = document.getElementById('google-signin-button-container');
        if (googleButtonContainer) {
            // Clear container to prevent duplicate buttons on re-render
            googleButtonContainer.innerHTML = ''; 
            window.google.accounts.id.renderButton(
                googleButtonContainer,
                { theme: theme === 'light' ? 'outline' : 'filled_black', size: 'medium', type: 'standard', text: 'signin_with' }
            );
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, theme]); // Rerun when user logs out or theme changes


  const handleLogout = () => {
    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
    }
    setUserProfile(null);
    setMedications([]);
  };

  // Effect to save medications to the backend whenever they change for a logged-in user.
  useEffect(() => {
    // Prevent saving on the initial data load after login.
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    
    if (userProfile?.id) {
        saveMedicationsForUser(userProfile.id, medications);
    }
  }, [medications, userProfile]);
  
  const handleAutoLogDose = (medicationId: string, newDosesTaken: Record<string, number>) => {
    setMedications(meds =>
      meds.map(med =>
        med.id === medicationId ? { ...med, dosesTaken: newDosesTaken } : med
      )
    );
  };

  // Run the notification scheduler
  useNotificationScheduler(medications, handleAutoLogDose, isAutoLoggingEnabled);

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

  const handleScanComplete = (data: ScannedMedicationData) => {
    setPrefilledData(data);
    setEditingMedication(null);
    setIsScannerVisible(false);
    setIsFormVisible(true);
  };

  return (
    <div className="min-h-screen bg-brand-gold-50 dark:bg-brand-gray-900 text-brand-gray-800 dark:text-brand-gray-200 font-sans transition-colors duration-300">
      <SlidingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAutoLoggingEnabled={isAutoLoggingEnabled}
        onAutoLoggingToggle={setIsAutoLoggingEnabled}
        user={userProfile}
        onLogout={handleLogout}
        onOpenScanner={handleOpenScanner}
      />
      <header className="bg-white dark:bg-brand-gray-800 shadow-sm dark:shadow-none dark:border-b dark:border-brand-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
             <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-gray-800 focus:ring-brand-gold-DEFAULT"
              aria-label="Open menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <Logo className="h-8 w-8 hidden sm:block" />
          </div>

          {/* Center Section (Responsive) */}
          <div className="flex-1 min-w-0 px-2 text-center">
             <h1 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100 tracking-tight truncate sm:hidden">
                Medication Tracker
              </h1>
             <div className="hidden sm:block">
              <RealTimeClock />
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
              onLogin={handleLoginSuccess}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!userProfile ? (
          <LoginPrompt />
        ) : isLoading ? (
            <div className="text-center py-20">
                <SpinnerIcon className="mx-auto h-12 w-12 animate-spin text-brand-gold-DEFAULT" />
                <p className="mt-4 text-brand-gray-500 dark:text-brand-gray-400">Loading your medications...</p>
            </div>
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

            <MedicationList
              medications={medications}
              onDeleteMedication={deleteMedication}
              onEditMedication={handleEditClick}
              onUpdateMedication={handleUpdateMedication}
              onShowHistory={handleShowHistory}
            />

            {medications.length === 0 && !isFormVisible && (
              <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
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
