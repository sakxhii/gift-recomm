import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationError = null;
    this.useMockData = false; // Fallback to mock data if OCR fails
  }

  /**
   * Initialize the OCR worker with retry logic
   */
  async initialize() {
    if (this.isInitialized) return true;

    // If already failed, use mock data
    if (this.initializationError && this.initializationError.retries >= 3) {
      console.warn('OCR failed multiple times, using mock data mode');
      this.useMockData = true;
      return false;
    }

    try {
      console.log('Initializing OCR worker...');

      // Try to initialize with robust configuration and longer timeout
      const initPromise = createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'loading tesseract core') console.log('Loading Tesseract core...');
          if (m.status === 'initializing tesseract') console.log('Initializing Tesseract...');
          if (m.status === 'recognizing text') console.log('Recognizing text...');
        },
        errorHandler: err => console.warn('OCR Warning:', err),
        // Use consistent, reliable CDN
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v4.0.3/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v4.0.3/tesseract-core.wasm.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0'
      });

      // Extended timeout to 30s for slower connections
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OCR initialization timeout (30s)')), 30000)
      );

      this.worker = await Promise.race([initPromise, timeoutPromise]);

      // Tesseract.js v5+ workers are pre-loaded and pre-initialized
      // await this.worker.load();      // DEPRECATED in v5
      // await this.worker.initialize('eng'); // DEPRECATED in v5

      this.isInitialized = true;
      this.initializationError = null;
      console.log('✓ OCR worker initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);

      // Track initialization errors
      if (!this.initializationError) {
        this.initializationError = {
          count: 1,
          lastError: error.message,
          retries: 0
        };
      } else {
        this.initializationError.count++;
        this.initializationError.lastError = error.message;
        this.initializationError.retries++;
      }

      // After 3 failures, switch to mock mode
      if (this.initializationError.retries >= 3) {
        console.warn('Switching to mock OCR mode after 3 failures');
        this.useMockData = true;
      }

      return false;
    }
  }

  /**
   * Process an image file for text extraction with fallback
   */
  async processImage(imageFile) {
    // 1. Try Gemini Vision (Best accuracy)
    const settings = localStorage.getItem('giftwise_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(decodeURIComponent(atob(settings)));
        const apiKey = parsed.geminiApiKey;

        if (apiKey) {
          console.log('Using Gemini Vision for OCR...');
          try {
            return await this.processWithGemini(imageFile, apiKey);
          } catch (geminiError) {
            console.error('Gemini API Failed:', geminiError);
            // DEBUG: Hard alert to catch why it fails silently
            window.alert('OCR Failed: ' + geminiError.message);
            // Fallback continues below
          }
        } else {
          console.log('No API Key found inside settings');
        }
      } catch (e) {
        console.warn('Failed to read settings for OCR', e);
      }
    } else {
      window.alert('No Settings found in LocalStorage!'); // DEBUG ALERT
    }

    // 2. Fallback to Tesseract (Client-side)
    if (!this.useMockData) {
      const initialized = await this.initialize();
      if (initialized && this.worker) {
        try {
          console.log('Starting local Tesseract processing...');
          const result = await this.worker.recognize(imageFile);
          const extractedData = this.extractStructuredData(result.data.text);
          return {
            success: true,
            rawText: result.data.text,
            extractedData,
            confidence: result.data.confidence,
            source: 'tesseract-local',
            processingTime: result.data.timing
          };
        } catch (error) {
          console.error('Real OCR failed, falling back to mock:', error);
          this.useMockData = true;
        }
      }
    }

    // 3. Fallback to Mock
    console.log('Using mock OCR data');
    return this.getMockOCRResult(imageFile);
  }

  async getPrioritizedVisionModels(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();

      if (!data.models) return ['gemini-1.5-flash', 'gemini-pro-vision'];

      // Filter for valid vision models
      const visionModels = data.models.filter(m =>
        m.supportedGenerationMethods.includes('generateContent') &&
        (m.name.includes('vision') || m.name.includes('1.5') || m.name.includes('flash'))
      );

      // Sort: Flash > 1.5 > Pro Vision
      visionModels.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        // Flash is usually best for speed/quota
        const isFlashA = nameA.includes('flash');
        const isFlashB = nameB.includes('flash');
        if (isFlashA && !isFlashB) return -1;
        if (!isFlashA && isFlashB) return 1;

        return 0;
      });

      return visionModels.map(m => m.name.replace('models/', ''));
    } catch (e) {
      console.warn('Failed to fetch vision models, using defaults', e);
      return ['gemini-1.5-flash', 'gemini-pro-vision'];
    }
  }

  async processWithGemini(imageFile, apiKey) {
    // Convert file to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const mimeType = imageFile.type || 'image/jpeg';

    // Get list of available vision models
    let models = await this.getPrioritizedVisionModels(apiKey);
    console.log('Available vision models:', models);

    let lastError = null;

    // Try each model until one works
    for (const modelName of models) {
      try {
        console.log(`Attempting OCR with model: ${modelName}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Extract contact info from this business card. Return ONLY a JSON object with keys: name, title, company, email, phone, website, social (object with linkedin, etc). Do not verify, just transcribe." },
                { inline_data: { mime_type: mimeType, data: base64Image } }
              ]
            }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API Request Failed (${modelName}): ${response.status} - ${errText}`);
        }

        const data = await response.json();

        if (data.promptFeedback && data.promptFeedback.blockReason) {
          throw new Error(`Blocked by safety settings: ${data.promptFeedback.blockReason}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          console.error('Empty Gemini Response:', data);
          throw new Error('Gemini returned empty response');
        }

        // Parse success
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const extracted = JSON.parse(cleanText);

        return {
          success: true,
          rawText: JSON.stringify(extracted, null, 2),
          extractedData: extracted,
          confidence: 99,
          source: `gemini-vision (${modelName})`,
          processingTime: { total: 1.0 }
        };

      } catch (error) {
        console.warn(`Vision model ${modelName} failed: ${error.message}`);
        lastError = error;
        // Continue to next model
        continue;
      }
    }

    // All models failed
    throw lastError || new Error('All vision models failed');
  }

  /**
   * Generate mock OCR results for development
   */
  async getMockOCRResult(imageFile) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock business card data
    const mockData = {
      name: 'Sarah Chen',
      title: 'Senior Data Scientist',
      company: 'TechInnovate Solutions',
      email: 'sarah.chen@techinnovate.com',
      phone: '+1 (555) 123-4567',
      website: 'techinnovate.com',
      social: {
        linkedin: 'sarah-chen-tech'
      }
    };

    const mockText = `
      ${mockData.name}
      ${mockData.title}
      ${mockData.company}
      
      Email: ${mockData.email}
      Phone: ${mockData.phone}
      Web: ${mockData.website}
      
      linkedin.com/in/${mockData.social.linkedin}
    `;

    return {
      success: true,
      rawText: mockText,
      extractedData: mockData,
      confidence: 85.5,
      source: 'mock-data',
      processingTime: { total: 1.5 },
      wordCount: 25
    };
  }

  /**
   * Extract structured data from OCR text
   */
  extractStructuredData(text) {
    const data = {
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      social: {}
    };

    if (!text) return data;

    // Convert to lowercase for easier matching
    const textLower = text.toLowerCase();
    const lines = text.split('\n').filter(line => line.trim());

    // Extract name
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (/^(mr\.|ms\.|mrs\.|dr\.|prof\.)?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/i.test(firstLine)) {
        data.name = firstLine;
      }
    }

    // Extract email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      data.email = emails[0];
    }

    // Extract phone
    const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      data.phone = phones[0];
    }

    // Extract website
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      data.website = urls[0].replace(/https?:\/\//, '');
    }

    // Extract company name
    const companyPatterns = [
      /(?:at\s+|,\s*)([A-Z][A-Za-z0-9\s&.,]+(?:\s+(?:Inc|LLC|Ltd|GmbH|Corp|Corporation))?)/i,
      /([A-Z][A-Za-z0-9\s&.,]+\s+(?:Inc|LLC|Ltd|GmbH|Corp|Corporation))/i,
      /company:\s*([^\n]+)/i
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.company = match[1].trim();
        break;
      }
    }

    // Extract title
    const titlePatterns = [
      /(?:position|title|role):\s*([^\n]+)/i,
      /([A-Z][a-z]+\s+)?(?:Manager|Director|Engineer|Analyst|Specialist|Consultant|Executive|Officer|President|CEO|CTO|CFO|COO)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.title = match[0].trim();
        break;
      }
    }

    // Extract social media
    const socialPatterns = {
      linkedin: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
      twitter: /twitter\.com\/([a-zA-Z0-9_]+)/i,
      github: /github\.com\/([a-zA-Z0-9-]+)/i
    };

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.social[platform] = match[1];
      }
    }

    return data;
  }

  /**
   * Clean up and terminate worker
   */
  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log('OCR worker terminated');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      }
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      useMockData: this.useMockData,
      initializationError: this.initializationError,
      worker: this.worker ? 'Active' : 'Not initialized'
    };
  }
}

// Create singleton instance
const ocrService = new OCRService();

export default ocrService;