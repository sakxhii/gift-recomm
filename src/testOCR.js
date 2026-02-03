import ocrService from './services/ocrService';

// Test the OCR service
export const testOCRService = async () => {
  console.log('=== Testing OCR Service ===');
  
  try {
    // Initialize
    await ocrService.initialize();
    console.log('✓ OCR Service initialized');
    
    // Get status
    const status = ocrService.getStatus();
    console.log('OCR Status:', status);
    
    // Note: Actual image processing test would require a real image file
    console.log('✓ OCR Service is ready for use');
    console.log('=== Test Complete ===');
    
    return true;
  } catch (error) {
    console.error('✗ OCR Test Failed:', error);
    return false;
  }
};

// Run test in browser console
if (typeof window !== 'undefined') {
  window.testOCR = testOCRService;
}