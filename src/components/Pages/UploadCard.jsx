import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, FileImage, X, Loader2, CheckCircle,
  AlertCircle, Scan, Edit2, RefreshCw, Info, Zap
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../Common/Card';
import { validateImageFile, createThumbnail, compressImage, enhanceForOCR } from '../../utils/imageProcessor';
import ocrService from '../../services/ocrService';
import { useProfiles } from '../../hooks/useLocalStorage';
import HelpModal from '../Common/HelpModal';
import { useAlert } from '../Common/Alert';
import storage from '../../utils/storage';

const UploadCard = () => {
  const navigate = useNavigate();
  const { addProfile } = useProfiles();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [validation, setValidation] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Initialize OCR service on mount
  const [ocrStatus, setOcrStatus] = useState(ocrService.isInitialized ? 'ready' : 'initializing');

  // Initialize OCR service on mount
  useEffect(() => {
    const initOCR = async () => {
      // Check for Gemini API key first
      const settings = storage.getSettings();
      if (settings && settings.geminiApiKey) {
        setOcrStatus('gemini');
        // Still try to init Tesseract in background as fallback
        if (!ocrService.isInitialized) {
          ocrService.initialize().catch(console.warn);
        }
        return;
      }

      try {
        const success = await ocrService.initialize();
        setOcrStatus(success ? 'ready' : 'mock');
        console.log('OCR service status updated:', success ? 'ready' : 'mock');
      } catch (error) {
        console.error('Failed to initialize OCR:', error);
        setOcrStatus('mock');
        setErrors(prev => [...prev, 'OCR initialization failed. Using offline mode.']);
      }
    };

    if (!ocrService.isInitialized) {
      initOCR();
    } else {
      // Double check if we should upgrade status to gemini
      const settings = storage.getSettings();
      if (settings && settings.geminiApiKey) {
        setOcrStatus('gemini');
      } else {
        setOcrStatus('ready');
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't terminate on unmount to keep it ready for other pages
      // ocrService.terminate();
    };
  }, []);

  // Handle drag events
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      if (isDragging) setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    };

    const dropZone = dropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener('dragover', handleDragOver);
        dropZone.removeEventListener('dragleave', handleDragLeave);
        dropZone.removeEventListener('drop', handleDrop);
      }
    };
  }, [isDragging]);

  const handleFileSelect = async (selectedFile) => {
    setErrors([]);
    setOcrResult(null);
    setValidation(null);

    // Validate file
    const validationResult = validateImageFile(selectedFile);
    setValidation(validationResult);

    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      return;
    }

    setFile(selectedFile);

    try {
      // Create thumbnail preview
      const thumbnail = await createThumbnail(selectedFile);
      setPreview(thumbnail);
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      setErrors(['Failed to create preview. Please try a different image.']);
      setFile(null);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const { showAlert } = useAlert();

  const processOCR = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep('Preparing image...');
    setProcessingProgress(10);
    setErrors([]);

    try {
      // Show info alert
      showAlert('info', 'Starting OCR processing...', 3000);

      let processingFile = file;

      // Step 1: Auto-enhance image if enabled
      if (autoEnhance) {
        setProcessingStep('Enhancing image for better OCR...');
        setProcessingProgress(20);
        processingFile = await enhanceForOCR(processingFile);
      }

      // Step 2: Compress image for faster processing
      setProcessingStep('Optimizing image...');
      setProcessingProgress(40);
      processingFile = await compressImage(processingFile, 1200, 0.8);

      // Step 3: Perform OCR
      setProcessingStep('Extracting text from image...');
      setProcessingProgress(60);

      const result = await ocrService.processImage(processingFile);

      setProcessingStep('Processing extracted data...');
      setProcessingProgress(80);

      if (result.success) {
        setOcrResult(result);
        showAlert('success', `OCR completed with ${result.confidence.toFixed(1)}% confidence`, 5000);
      } else {
        throw new Error(result.error || 'OCR processing failed');
      }

      setProcessingStep('Complete!');
      setProcessingProgress(100);

      // Auto-navigate after short delay if successful
      setTimeout(() => {
        if (result.success && result.extractedData) {
          handleContinueToConfirmation(result.extractedData);
        }
      }, 1000);

    } catch (error) {
      console.error('OCR processing error:', error);
      showAlert('error', `OCR Error: ${error.message}`, 7000);
      setErrors([`OCR Processing Error: ${error.message}`]);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setProcessingProgress(0);
      }, 500);
    }
  };

  const handleContinueToConfirmation = (extractedData = null) => {
    if (ocrResult && ocrResult.extractedData) {
      // Store extracted data temporarily in session storage
      sessionStorage.setItem('giftwise_extracted_data', JSON.stringify(ocrResult.extractedData));
      sessionStorage.setItem('giftwise_original_image', preview);

      // Navigate to confirmation page (we'll create this next)
      navigate('/confirm-profile');
    } else if (extractedData) {
      sessionStorage.setItem('giftwise_extracted_data', JSON.stringify(extractedData));
      sessionStorage.setItem('giftwise_original_image', preview);
      navigate('/confirm-profile');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview('');
    setOcrResult(null);
    setErrors([]);
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleManualEntry = () => {
    navigate('/manual-entry');
  };

  // Calculate confidence level
  const getConfidenceLevel = (confidence) => {
    if (confidence > 80) return { label: 'High', color: 'text-green-600', bg: 'bg-green-50' };
    if (confidence > 60) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Upload Business Card</h1>
        <p className="text-gray-600">
          Upload a photo of a business card to extract contact information automatically
        </p>
      </div>

      {/* Main upload area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Upload interface */}
        <Card className="lg:col-span-1">
          <CardHeader border>
            <CardTitle>Upload Method</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Choose how you want to upload the business card
            </p>
          </CardHeader>

          <CardContent>
            {/* Drag & Drop Zone */}
            <div
              ref={dropZoneRef}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
                ${file ? 'border-green-500 bg-green-50' : ''}
              `}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-xs">
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded-lg shadow-md w-full h-auto"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click to select a different image
                  </p>
                  {validation?.fileInfo && (
                    <div className="text-xs text-gray-500">
                      {validation.fileInfo.name} • {validation.fileInfo.sizeFormatted}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-gray-100">
                      <Upload size={32} className="text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Drag & drop business card image
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Supported: JPG, PNG, WebP, BMP, GIF</p>
                    <p>Max size: 5MB</p>
                  </div>
                </>
              )}
            </div>

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Camera input (hidden) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 btn btn-secondary py-3"
              >
                <FileImage size={18} />
                Browse Files
              </button>
              <button
                onClick={handleCameraCapture}
                className="flex items-center justify-center gap-2 btn btn-secondary py-3"
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>



            {/* Advanced options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span>Advanced Options</span>
                <span className="transform transition-transform" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>
                  ▼
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap size={16} className="text-primary-600 mr-2" />
                      <span className="text-sm text-gray-700">Auto-enhance image</span>
                      <Info size={14} className="ml-2 text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoEnhance}
                        onChange={(e) => setAutoEnhance(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Automatically improve image quality for better text recognition
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <button
              onClick={handleManualEntry}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Or enter details manually →
            </button>
          </CardFooter>
        </Card>

        {/* Right column - Processing & Results */}
        <div className="space-y-6">
          {/* Processing Status */}
          {isProcessing && (
            <Card>
              <CardHeader border>
                <div className="flex items-center">
                  <Loader2 className="animate-spin text-primary-600 mr-3" size={20} />
                  <CardTitle>Processing Image</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{processingStep}</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    This may take a few seconds depending on image quality
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* OCR Status Card */}
          {!isProcessing && !ocrResult && (
            <Card>
              <CardHeader border>
                <div className="flex items-center">
                  <Scan size={20} className="text-primary-600 mr-3" />
                  <CardTitle>OCR Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">OCR Engine</span>
                    <span className="text-sm font-medium text-primary-600">
                      {ocrStatus === 'mock' ? 'Mock Mode' :
                        ocrStatus === 'gemini' ? 'Gemini AI Vision' : 'Tesseract.js'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${ocrStatus === 'ready' || ocrStatus === 'gemini'
                      ? 'text-green-600'
                      : ocrStatus === 'mock'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                      }`}>
                      {ocrStatus === 'ready'
                        ? 'Ready'
                        : ocrStatus === 'gemini'
                          ? 'Online (Cloud)'
                          : ocrStatus === 'mock'
                            ? 'Using Mock Data'
                            : 'Initializing...'}
                    </span>
                  </div>

                  {ocrStatus === 'mock' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle size={16} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Using Mock Data</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            OCR engine failed to connect. Showing sample data for demonstration.
                            The app is fully functional for testing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {ocrStatus === 'initializing' && (
                    <div className="text-center py-3">
                      <Loader2 className="animate-spin text-primary-600 mx-auto mb-2" size={20} />
                      <p className="text-sm text-gray-600">Initializing OCR engine...</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Downloading language data (approx. 2MB)...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* OCR Results */}
          {ocrResult && ocrResult.success && (
            <Card>
              <CardHeader border>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-3" size={20} />
                    <CardTitle>Text Extraction Complete</CardTitle>
                  </div>
                  {ocrResult.confidence && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceLevel(ocrResult.confidence).bg
                      } ${getConfidenceLevel(ocrResult.confidence).color}`}
                    >
                      {getConfidenceLevel(ocrResult.confidence).label} Confidence
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Extracted data preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Extracted Information:</h4>
                    <div className="space-y-2">
                      {ocrResult.extractedData.name && (
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-500">Name:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {ocrResult.extractedData.name}
                          </span>
                        </div>
                      )}
                      {ocrResult.extractedData.title && (
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-500">Title:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {ocrResult.extractedData.title}
                          </span>
                        </div>
                      )}
                      {ocrResult.extractedData.company && (
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-500">Company:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {ocrResult.extractedData.company}
                          </span>
                        </div>
                      )}
                      {ocrResult.extractedData.email && (
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-500">Email:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {ocrResult.extractedData.email}
                          </span>
                        </div>
                      )}
                      {ocrResult.extractedData.phone && (
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-500">Phone:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {ocrResult.extractedData.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw text preview (collapsible) */}
                  <div>
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        <span>View extracted text</span>
                        <span className="group-open:rotate-180">▼</span>
                      </summary>
                      <div className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                        {ocrResult.rawText || 'No text extracted'}
                      </div>
                    </details>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">
                        {ocrResult.wordCount || 0}
                      </div>
                      <div className="text-xs text-gray-500">Words</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">
                        {ocrResult.confidence ? `${ocrResult.confidence.toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">
                        {ocrResult.processingTime?.total ? `${ocrResult.processingTime.total.toFixed(1)}s` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Processing Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleContinueToConfirmation()}
                    className="flex-1 btn btn-primary"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Continue to Confirmation
                  </button>
                  <button
                    onClick={() => setOcrResult(null)}
                    className="btn btn-secondary"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Action Buttons */}
          {file && !isProcessing && !ocrResult && (
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Scan className="text-primary-600 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900">Ready to Extract Text</h3>
                      <p className="text-sm text-gray-600">
                        Click the button below to scan the business card
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={processOCR}
                    disabled={isProcessing}
                    className="w-full btn btn-primary py-3"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scan size={18} className="mr-2" />
                        Extract Contact Information
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleManualEntry}
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      <Edit2 size={14} className="inline mr-1" />
                      Enter details manually instead
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent>
                <div className="flex items-start">
                  <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Error{errors.length > 1 ? 's' : ''}:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader border>
              <CardTitle size="sm">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Use good lighting and avoid shadows</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Place card on a contrasting background</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Hold camera steady and square to the card</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Ensure text is clear and not blurry</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Avoid glare on glossy cards</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Add a help button somewhere in the UI, for example: */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 transition-colors"
      >
        <AlertCircle size={24} />
      </button>

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary"
        >
          ← Back to Dashboard
        </button>

        {file && (
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="btn btn-secondary"
            >
              <X size={18} className="mr-2" />
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCard;