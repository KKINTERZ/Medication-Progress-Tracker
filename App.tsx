import React, { useState, useEffect, useMemo } from 'react';
import { Medication, UserProfile } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import AddMedicationForm from './components/AddMedicationForm';
import MedicationList from './components/MedicationList';
import { PillIcon, PlusIcon, SunIcon, MoonIcon, EditIcon } from './components/Icons';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import MedicationHistoryModal from './components/MedicationHistoryModal';
import { useTheme } from './hooks/useTheme';
import { jwtDecode } from 'jwt-decode';
import UserProfileDisplay from './components/UserProfile';

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
        }): void;
        renderButton(
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_black';
            size?: 'medium';
            type?: 'standard';
            text?: 'signin_with';
            [key: string]: unknown;
          }
        ): void;
        disableAutoSelect(): void;
      };
    };
  }
  interface Window {
    google?: typeof google;
  }
}

const LoginPrompt: React.FC = () => (
  <div className="text-center py-20 px-6 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <PillIcon className="mx-auto h-16 w-16 text-brand-gray-300 dark:text-brand-gray-600"/>
    <h3 className="mt-4 text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">Welcome to Medication Tracker</h3>
    <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">
      Please sign in with your Google account to continue.
    </p>
  </div>
);

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', [], userProfile?.id);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [historyMedication, setHistoryMedication] = useState<Medication | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const handleLoginSuccess = (credentialResponse: google.CredentialResponse) => {
    const decoded: { sub: string, name: string, email: string, picture: string } = jwtDecode(credentialResponse.credential);
    const profile: UserProfile = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
    };
    setUserProfile(profile);
  };

  const handleLogout = () => {
    google.accounts.id.disableAutoSelect();
    setUserProfile(null);
  };

  // Run the notification scheduler
  useNotificationScheduler(medications);

  const uniqueMedicationNames = useMemo(() => {
    return [...new Set(medications.map(med => med.name.trim()).filter(Boolean))].sort();
  }, [medications]);

  const handleAddNewClick = () => {
    setEditingMedication(null);
    setIsFormVisible(true);
  };
  
  const handleEditClick = (med: Medication) => {
    setEditingMedication(med);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingMedication(null);
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
          <div className="flex items-center space-x-3">
            <PillIcon className="h-8 w-8 text-brand-gold-dark" />
            <h1 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100 tracking-tight">
              Medication Tracker
            </h1>
          </div>
          <UserProfileDisplay
            user={userProfile}
            onLogin={handleLoginSuccess}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!userProfile ? (
          <LoginPrompt />
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
                <PillIcon className="mx-auto h-16 w-16 text-brand-gray-300 dark:text-brand-gray-600"/>
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