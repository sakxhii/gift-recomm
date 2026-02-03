import storage from './storage';

// Test the storage system
export const runStorageTests = () => {
  console.log('=== Running Storage Tests ===');
  
  // Test 1: Check initialization
  console.log('User ID:', storage.getUserId());
  console.log('Profiles:', storage.getProfiles().length);
  console.log('Settings:', storage.getSettings());
  
  // Test 2: Add a profile
  const testProfile = storage.addProfile({
    name: 'John Doe',
    company: 'Test Corp',
    title: 'CEO',
    email: 'john@test.com'
  });
  console.log('Added profile:', testProfile);
  
  // Test 3: Update profile
  const updated = storage.updateProfile(testProfile.id, {
    phone: '+1234567890'
  });
  console.log('Updated profile:', updated);
  
  // Test 4: Add gift history
  const gift = storage.markGiftGiven(testProfile.id, 'Test Gift', 'Birthday');
  console.log('Added gift:', gift);
  
  // Test 5: Get stats
  console.log('Stats:', storage.getStats());
  
  // Test 6: Export
  const exportData = storage.exportAllData();
  console.log('Export size:', exportData.jsonString.length, 'characters');
  
  // Test 7: Clear test data
  storage.deleteProfile(testProfile.id);
  console.log('Test profile deleted');
  
  console.log('=== Tests Complete ===');
};

// Run in browser console
if (typeof window !== 'undefined') {
  window.testGiftwiseStorage = runStorageTests;
}