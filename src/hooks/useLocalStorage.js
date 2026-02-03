import { useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';

/**
 * Custom hook to sync component state with local storage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      switch (key) {
        case 'profiles':
          return storage.getProfiles();
        case 'giftHistory':
          return storage.getGiftHistory();
        case 'settings':
          return storage.getSettings();
        case 'stats':
          return storage.getStats();
        default:
          return initialValue;
      }
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);

      // Dispatch update event
      window.dispatchEvent(new CustomEvent('giftwiseStorage:manualUpdate', {
        detail: { key, value }
      }));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  }, [key]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (event.detail?.key === key) {
        setStoredValue(event.detail.value);
      }
    };

    const handleProfilesUpdated = () => {
      if (key === 'profiles') {
        setStoredValue(storage.getProfiles());
      }
    };

    const handleHistoryUpdated = () => {
      if (key === 'giftHistory') {
        setStoredValue(storage.getGiftHistory());
      }
    };

    const handleSettingsUpdated = () => {
      if (key === 'settings') {
        setStoredValue(storage.getSettings());
      }
    };

    const handleDataCleared = () => {
      if (key === 'profiles') setStoredValue([]);
      if (key === 'giftHistory') setStoredValue([]);
      if (key === 'settings') setStoredValue({});
      if (key === 'stats') setStoredValue(storage.getStats());
    };

    // Custom events
    window.addEventListener('giftwiseStorage:manualUpdate', handleStorageUpdate);
    window.addEventListener('giftwiseStorage:profilesUpdated', handleProfilesUpdated);
    window.addEventListener('giftwiseStorage:historyUpdated', handleHistoryUpdated);
    window.addEventListener('giftwiseStorage:settingsUpdated', handleSettingsUpdated);
    window.addEventListener('giftwiseStorage:dataCleared', handleDataCleared);

    // Standard storage event (other tabs)
    const handleStorageChange = (e) => {
      if (e.key?.startsWith('giftwise_')) {
        switch (key) {
          case 'profiles':
            setStoredValue(storage.getProfiles());
            break;
          case 'giftHistory':
            setStoredValue(storage.getGiftHistory());
            break;
          case 'settings':
            setStoredValue(storage.getSettings());
            break;
          case 'stats':
            setStoredValue(storage.getStats());
            break;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('giftwiseStorage:manualUpdate', handleStorageUpdate);
      window.removeEventListener('giftwiseStorage:profilesUpdated', handleProfilesUpdated);
      window.removeEventListener('giftwiseStorage:historyUpdated', handleHistoryUpdated);
      window.removeEventListener('giftwiseStorage:settingsUpdated', handleSettingsUpdated);
      window.removeEventListener('giftwiseStorage:dataCleared', handleDataCleared);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Hook for app statistics with auto-refresh
 */
export const useAppStats = () => {
  const [stats, setStats] = useState(storage.getStats());
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(() => {
    setIsLoading(true);
    setStats(storage.getStats());
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  useEffect(() => {
    const updateStats = () => {
      setStats(storage.getStats());
    };

    // Listen for storage updates
    window.addEventListener('giftwiseStorage:profilesUpdated', updateStats);
    window.addEventListener('giftwiseStorage:historyUpdated', updateStats);
    window.addEventListener('giftwiseStorage:settingsUpdated', updateStats);
    window.addEventListener('giftwiseStorage:dataCleared', updateStats);

    // Initial refresh
    refreshStats();

    return () => {
      window.removeEventListener('giftwiseStorage:profilesUpdated', updateStats);
      window.removeEventListener('giftwiseStorage:historyUpdated', updateStats);
      window.removeEventListener('giftwiseStorage:settingsUpdated', updateStats);
      window.removeEventListener('giftwiseStorage:dataCleared', updateStats);
    };
  }, [refreshStats]);

  return { stats, refreshStats, isLoading };
};

/**
 * Hook for managing profiles
 */
export const useProfiles = () => {
  const [profiles, setProfiles] = useLocalStorage('profiles', []);
  const [isLoading, setIsLoading] = useState(false);

  const addProfile = useCallback((profileData) => {
    setIsLoading(true);
    try {
      const newProfile = storage.addProfile(profileData);
      setProfiles(storage.getProfiles());
      return newProfile;
    } catch (error) {
      console.error('Error adding profile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setProfiles]);

  const updateProfile = useCallback((profileId, updates) => {
    setIsLoading(true);
    try {
      const updated = storage.updateProfile(profileId, updates);
      setProfiles(storage.getProfiles());
      return updated;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setProfiles]);

  const deleteProfile = useCallback((profileId) => {
    setIsLoading(true);
    try {
      storage.deleteProfile(profileId);
      setProfiles(storage.getProfiles());
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setProfiles]);

  const getProfile = useCallback((profileId) => {
    return profiles.find(p => p.id === profileId) || storage.getProfile(profileId);
  }, [profiles]);

  return {
    profiles,
    getProfile, // Added this
    addProfile,
    updateProfile,
    deleteProfile,
    isLoading,
    count: profiles.length
  };
};

/**
 * Hook for managing gift history
 */
export const useGiftHistory = () => {
  const [history, setHistory] = useLocalStorage('giftHistory', []);
  const [isLoading, setIsLoading] = useState(false);

  const addGift = useCallback((giftData) => {
    setIsLoading(true);
    try {
      const newGift = storage.addGiftToHistory(giftData);
      setHistory(storage.getGiftHistory());
      return newGift;
    } catch (error) {
      console.error('Error adding gift:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setHistory]);

  const markGiftGiven = useCallback((profileId, giftName, occasion = null, notes = '') => {
    setIsLoading(true);
    try {
      const newGift = storage.markGiftGiven(profileId, giftName, occasion, notes);
      setHistory(storage.getGiftHistory());
      return newGift;
    } catch (error) {
      console.error('Error marking gift given:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setHistory]);

  return {
    history,
    addGift,
    markGiftGiven,
    isLoading,
    count: history.length
  };
};