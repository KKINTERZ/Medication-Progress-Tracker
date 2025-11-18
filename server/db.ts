import { Medication, UserProfile } from '../types';

// --- MOCK DATABASE ---
// In a real application, this would be a connection to a database like PostgreSQL, MongoDB, etc.
// For this simulation, we use in-memory maps to store data for the session.
// Data will be lost on page refresh.

interface UserRecord extends UserProfile {
  medications: Medication[];
}

const db = new Map<string, UserRecord>();

export const database = {
  /**
   * Finds a user by their ID (Google 'sub' identifier).
   */
  findUserById: async (id: string): Promise<UserRecord | undefined> => {
    return db.get(id);
  },

  /**
   * Creates a new user or updates an existing one's profile details.
   */
  upsertUserProfile: async (profile: UserProfile): Promise<UserRecord> => {
    const existingUser = db.get(profile.id);
    if (existingUser) {
      // Update profile info but preserve medications
      const updatedUser = { ...existingUser, ...profile };
      db.set(profile.id, updatedUser);
      return updatedUser;
    } else {
      // Create a new user with an empty medication list
      const newUser: UserRecord = { ...profile, medications: [] };
      db.set(profile.id, newUser);
      return newUser;
    }
  },

  /**
   * Replaces the entire medication list for a given user.
   */
  saveUserMedications: async (userId: string, medications: Medication[]): Promise<boolean> => {
    const user = db.get(userId);
    if (user) {
      user.medications = medications;
      db.set(userId, user);
      return true;
    }
    return false; // User not found
  }
};
