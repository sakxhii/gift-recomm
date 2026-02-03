import { STORAGE_KEYS, APP_VERSION, MAX_LOCAL_STORAGE, DEFAULT_API_KEY } from './constants';
import { encryptData, decryptData, generateChecksum, compressData } from './encryption';

class GiftwiseStorage {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize storage with default values
   */
  init() {
    if (this.initialized) return;

    try {
      // Generate anonymous user ID if not exists
      if (!this.getUserId()) {
        const userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      }

      // Initialize empty data structures if not exists
      const profiles = this.getProfiles();
      if (!profiles || !Array.isArray(profiles)) {
        this.saveProfiles([]);
      }

      const history = this.getGiftHistory();
      if (!history || !Array.isArray(history)) {
        this.saveGiftHistory([]);
      }

      const settings = this.getSettings();
      if (!settings || typeof settings !== 'object' || Object.keys(settings).length === 0) {
        this.saveSettings({
          version: APP_VERSION,
          createdAt: new Date().toISOString(),
          theme: 'light',
          enableNotifications: true,
          autoBackup: false,
          dataRetention: 365, // days
          geminiApiKey: DEFAULT_API_KEY // Use shared default key
        });
      }

      // Set version
      localStorage.setItem(STORAGE_KEYS.VERSION, APP_VERSION);
      this.initialized = true;

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('giftwiseStorage:initialized'));

    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  /**
   * Get anonymous user ID
   */
  getUserId() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Profile Management
   */
  saveProfiles(profiles) {
    try {
      const data = {
        profiles,
        updatedAt: new Date().toISOString(),
        checksum: generateChecksum(profiles)
      };
      const encrypted = encryptData(data);
      localStorage.setItem(STORAGE_KEYS.PROFILES, encrypted);

      window.dispatchEvent(new CustomEvent('giftwiseStorage:profilesUpdated'));
      return true;
    } catch (error) {
      console.error('Error saving profiles:', error);
      return false;
    }
  }

  getProfiles() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (!encrypted) return [];

      const decrypted = decryptData(encrypted);
      return decrypted?.profiles || [];
    } catch (error) {
      console.error('Error getting profiles:', error);
      return [];
    }
  }

  getProfile(id) {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  addProfile(profileData) {
    const profiles = this.getProfiles();
    const newProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      giftCount: 0,
      lastGiftDate: null
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);
    this.updateLastBackup();

    return newProfile;
  }

  updateProfile(profileId, updates) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profileId);

    if (index !== -1) {
      profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveProfiles(profiles);
      return profiles[index];
    }

    return null;
  }

  deleteProfile(profileId) {
    const profiles = this.getProfiles().filter(p => p.id !== profileId);
    this.saveProfiles(profiles);
    return true;
  }

  /**
   * Gift History Management
   */
  saveGiftHistory(history) {
    try {
      const data = {
        history,
        updatedAt: new Date().toISOString(),
        checksum: generateChecksum(history)
      };
      const encrypted = encryptData(data);
      localStorage.setItem(STORAGE_KEYS.GIFT_HISTORY, encrypted);

      window.dispatchEvent(new CustomEvent('giftwiseStorage:historyUpdated'));
      return true;
    } catch (error) {
      console.error('Error saving gift history:', error);
      return false;
    }
  }

  getGiftHistory() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.GIFT_HISTORY);
      if (!encrypted) return [];

      const decrypted = decryptData(encrypted);
      return decrypted?.history || [];
    } catch (error) {
      console.error('Error getting gift history:', error);
      return [];
    }
  }

  addGiftToHistory(giftData) {
    const history = this.getGiftHistory();
    const newGift = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...giftData,
      givenAt: new Date().toISOString(),
      status: 'given'
    };

    history.push(newGift);
    this.saveGiftHistory(history);

    // Update profile gift count
    if (giftData.profileId) {
      const profile = this.getProfile(giftData.profileId);
      if (profile) {
        this.updateProfile(giftData.profileId, {
          giftCount: (profile.giftCount || 0) + 1,
          lastGiftDate: new Date().toISOString()
        });
      }
    }

    this.updateLastBackup();
    return newGift;
  }

  markGiftGiven(profileId, giftName, occasion = null, notes = '') {
    return this.addGiftToHistory({
      profileId,
      giftName,
      occasion,
      notes,
      status: 'given'
    });
  }

  /**
   * Settings Management
   */
  saveSettings(settings) {
    try {
      const data = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      const encrypted = encryptData(data);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, encrypted);

      window.dispatchEvent(new CustomEvent('giftwiseStorage:settingsUpdated'));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  getSettings() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!encrypted) {
        // Fallback for fresh/empty installs
        return DEFAULT_API_KEY ? { geminiApiKey: DEFAULT_API_KEY } : {};
      }

      const settings = decryptData(encrypted) || {};

      // Inject default key if user hasn't set one yet and we have a hardcoded default
      if (!settings.geminiApiKey && DEFAULT_API_KEY) {
        settings.geminiApiKey = DEFAULT_API_KEY;
      }

      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  updateSettings(updates) {
    const currentSettings = this.getSettings();
    const newSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const success = this.saveSettings(newSettings);
    return success;
  }

  /**
   * Backup & Storage Utilities
   */
  updateLastBackup() {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
  }

  getLastBackup() {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  }

  getStorageUsage() {
    try {
      let totalBytes = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('giftwise_')) {
          totalBytes += (localStorage.getItem(key)?.length || 0) * 2;
        }
      }

      return {
        used: totalBytes,
        max: MAX_LOCAL_STORAGE,
        percentage: Math.min((totalBytes / MAX_LOCAL_STORAGE) * 100, 100),
        formatted: `${(totalBytes / 1024 / 1024).toFixed(2)}MB / ${(MAX_LOCAL_STORAGE / 1024 / 1024).toFixed(0)}MB`
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, max: MAX_LOCAL_STORAGE, percentage: 0, formatted: '0MB / 10MB' };
    }
  }

  /**
   * Export all data for backup
   */
  exportAllData() {
    try {
      const data = {
        meta: {
          version: APP_VERSION,
          exportedAt: new Date().toISOString(),
          userId: this.getUserId(),
          totalProfiles: this.getProfiles().length,
          totalGifts: this.getGiftHistory().length
        },
        profiles: this.getProfiles(),
        giftHistory: this.getGiftHistory(),
        settings: this.getSettings()
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        data,
        jsonString,
        blob,
        url,
        fileName: `giftwise_backup_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import data from backup
   */
  importData(jsonString) {
    try {
      const importedData = JSON.parse(jsonString);

      // Validate structure
      if (!importedData.profiles || !Array.isArray(importedData.profiles)) {
        throw new Error('Invalid backup format: Missing profiles array');
      }

      if (!importedData.giftHistory || !Array.isArray(importedData.giftHistory)) {
        throw new Error('Invalid backup format: Missing giftHistory array');
      }

      // Import data
      this.saveProfiles(importedData.profiles);
      this.saveGiftHistory(importedData.giftHistory);

      if (importedData.settings && typeof importedData.settings === 'object') {
        this.saveSettings(importedData.settings);
      }

      this.updateLastBackup();

      return {
        success: true,
        stats: {
          profiles: importedData.profiles.length,
          gifts: importedData.giftHistory.length
        },
        message: `Successfully imported ${importedData.profiles.length} profiles and ${importedData.giftHistory.length} gifts`
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Clear all data (reset app)
   */
  clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.FIRST_VISIT) {
          localStorage.removeItem(key);
        }
      });

      // Re-initialize
      this.initialized = false;
      this.init();

      window.dispatchEvent(new CustomEvent('giftwiseStorage:dataCleared'));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Get comprehensive app statistics
   */
  getStats() {
    const profiles = this.getProfiles();
    const history = this.getGiftHistory();
    const storageUsage = this.getStorageUsage();

    // Calculate statistics
    const giftsByMonth = {};
    const giftsByOccasion = {};
    let totalSpent = 0;

    history.forEach(gift => {
      // Monthly distribution
      const month = gift.givenAt ? gift.givenAt.substr(0, 7) : 'unknown';
      giftsByMonth[month] = (giftsByMonth[month] || 0) + 1;

      // Occasion distribution
      const occasion = gift.occasion || 'unknown';
      giftsByOccasion[occasion] = (giftsByOccasion[occasion] || 0) + 1;

      // Total spent (mock - would need actual price data)
      totalSpent += 100; // Mock average gift value
    });

    return {
      totalProfiles: profiles.length,
      totalGiftsGiven: history.length,
      storageUsage,
      lastBackup: this.getLastBackup(),
      totalSpent: `$${totalSpent}`,
      recentGifts: history.slice(-10).reverse(),
      topProfiles: profiles
        .sort((a, b) => (b.giftCount || 0) - (a.giftCount || 0))
        .slice(0, 5),
      giftsByMonth,
      giftsByOccasion
    };
  }

  /**
   * Check if first visit
   */
  isFirstVisit() {
    return !localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  }

  markVisited() {
    localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, 'true');
  }
}

// Create and export singleton instance
const storage = new GiftwiseStorage();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  storage.init();
}

export default storage;