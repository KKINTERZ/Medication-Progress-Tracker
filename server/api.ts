import { Medication, UserProfile } from '../types';
import { database } from './db';

// --- MOCK BACKEND API ---
// This module simulates a backend API layer. In a real application, these functions
// would make network requests (e.g., using fetch) to a deployed backend server.
// To simulate network latency, a small delay is added to each function.

const MOCK_API_LATENCY = 500; // 500ms delay

/**
 * Handles user sign-up/sign-in.
 * Creates a new user profile if one doesn't exist, or updates the existing one.
 * Fetches and returns the user's stored data, including their medications.
 * @param profile - The user profile object from Google Sign-In.
 * @returns The full user record, including their saved medications.
 */
export const upsertUserAndGetMeds = async (profile: UserProfile): Promise<{ user: UserProfile, medications: Medication[] }> => {
  console.log('[API] Upserting user and fetching data for:', profile.email);
  return new Promise(resolve => {
    setTimeout(async () => {
      const userRecord = await database.upsertUserProfile(profile);
      // In a real API, you might not return the full record, but for our case it's efficient.
      const { medications, ...userProfile } = userRecord;
      resolve({ user: userProfile, medications });
    }, MOCK_API_LATENCY);
  });
};

/**
 * Saves the user's entire list of medications to the backend.
 * @param userId - The unique ID of the user.
 * @param medications - The array of medication objects to save.
 */
export const saveMedicationsForUser = async (userId: string, medications: Medication[]): Promise<void> => {
    console.log(`[API] Saving ${medications.length} medications for user ID:`, userId);
    return new Promise(resolve => {
        setTimeout(async () => {
            await database.saveUserMedications(userId, medications);
            resolve();
        }, MOCK_API_LATENCY);
    });
};
