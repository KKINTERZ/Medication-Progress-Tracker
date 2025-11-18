import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(key: string, initialValue: T, userId: string | null = null): [T, Dispatch<SetStateAction<T>>] {
  const userKey = userId ? `${key}_${userId}` : null;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!userKey) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    if (!userKey) return;
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(userKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userKey) {
      try {
        const item = window.localStorage.getItem(userKey);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (error) {
        console.error(error);
        setStoredValue(initialValue);
      }
    } else {
      // If user logs out, clear the state
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  return [storedValue, setValue];
}

export default useLocalStorage;
