import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(key: string, initialValue: T, userId: string | null = null): [T, Dispatch<SetStateAction<T>>] {
  // Determine the actual key to use in localStorage.
  // This will be 'key_userId' for user-specific data, or just 'key' for global data like theme.
  const storageKey = userId ? `${key}_${userId}` : key;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Always try to get the item from localStorage using the determined key.
      const item = window.localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${storageKey}”:`, error);
      return initialValue;
    }
  });

  // This effect re-syncs the state with localStorage if the key changes
  // (e.g., when a user logs in or out, the storageKey for medications will change).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key “${storageKey}”:`, error);
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      // Allow value to be a function, just like in useState.
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Update state.
      setStoredValue(valueToStore);
      // Persist to localStorage.
      window.localStorage.setItem(storageKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key “${storageKey}”:`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
