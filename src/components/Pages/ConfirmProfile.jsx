import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Building, Briefcase, Mail, Phone, Globe,
  Linkedin, Twitter, Calendar, Gift, DollarSign, Tag,
  Save, Edit2, ArrowLeft, CheckCircle, AlertCircle,
  X, Plus, Trash2, Eye, EyeOff
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../Common/Card';
import { OCCASIONS, RELATIONSHIPS, BUDGET_RANGES, INDUSTRIES } from '../../utils/constants';
import { useProfiles } from '../../hooks/useLocalStorage';

const ConfirmProfile = () => {
  const navigate = useNavigate();
  const { addProfile } = useProfiles();

  const [extractedData, setExtractedData] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
    twitter: '',
    industry: '',
    relationship: 'colleague',
    occasions: [],
    budgetRange: 'medium',
    interests: [],
    notes: ''
  });
  const [newInterest, setNewInterest] = useState('');
  const [newOccasion, setNewOccasion] = useState('');
  const [isEditing, setIsEditing] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  // Load extracted data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem('giftwise_extracted_data');
    const storedImage = sessionStorage.getItem('giftwise_original_image');

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setExtractedData(parsedData);

        // Populate form with extracted data
        setFormData(prev => ({
          ...prev,
          name: parsedData.name || '',
          title: parsedData.title || '',
          company: parsedData.company || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          website: parsedData.website || '',
          linkedin: parsedData.social?.linkedin || '',
          twitter: parsedData.social?.twitter || ''
        }));
      } catch (error) {
        console.error('Error parsing extracted data:', error);
      }
    }

    if (storedImage) {
      setProfileImage(storedImage);
    }

    // Clean up session storage on unmount
    return () => {
      sessionStorage.removeItem('giftwise_extracted_data');
      sessionStorage.removeItem('giftwise_original_image');
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleAddOccasion = () => {
    if (newOccasion.trim() && !formData.occasions.includes(newOccasion.trim())) {
      setFormData(prev => ({
        ...prev,
        occasions: [...prev.occasions, newOccasion.trim()]
      }));
      setNewOccasion('');
    }
  };

  const handleRemoveOccasion = (occasion) => {
    setFormData(prev => ({
      ...prev,
      occasions: prev.occasions.filter(o => o !== occasion)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Create profile object
      const profile = {
        ...formData,
        createdAt: new Date().toISOString(),
        image: profileImage,
        source: 'ocr',
        extractedData: extractedData
      };

      // Add to storage
      const savedProfile = addProfile(profile);

      if (savedProfile) {
        // Navigate to gift suggestions page
        navigate('/gift-suggestions', { state: { profileId: savedProfile.id } });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipToGifts = () => {
    if (validateForm()) {
      handleSaveProfile();
    }
  };

  const handleBack = () => {
    navigate('/upload');
  };

  const toggleEditField = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Render field with edit capability
  const renderEditableField = (field, label, icon, placeholder = '', type = 'text') => {
    const isEditingField = isEditing[field] || false;
    const value = formData[field];
    const error = errors[field];

    return (
      <div className="mb-4">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
          {icon}
          <span className="ml-2">{label}</span>
        </label>

        <div className="flex items-center gap-2">
          {isEditingField ? (
            <input
              type={type}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={`flex-1 input ${error ? 'input-error' : ''}`}
              placeholder={placeholder}
              onBlur={() => toggleEditField(field)}
              onKeyPress={(e) => e.key === 'Enter' && toggleEditField(field)}
              autoFocus
            />
          ) : (
            <div
              className={`flex-1 px-3 py-2 rounded-lg border ${value ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
                } ${error ? 'border-red-300' : ''}`}
              onClick={() => toggleEditField(field)}
            >
              {value || (
                <span className="text-gray-400 italic">{placeholder}</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleEditField(field)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isEditingField ? <CheckCircle size={18} /> : <Edit2 size={18} />}
          </button>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Upload
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Confirm Profile Details
        </h1>
        <p className="text-gray-600">
          Review and edit the extracted information. Add additional details for better gift suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information Card */}
          <Card>
            <CardHeader border>
              <div className="flex items-center justify-between">
                <CardTitle>Basic Information</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  {/* Source Indicator */}
                  {formData.name === 'Sarah Chen' ? (
                    <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs mr-2">
                      <AlertCircle size={12} className="mr-1" /> Mock Data
                    </span>
                  ) : (extractedData && (
                    <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs mr-2">
                      <CheckCircle size={12} className="mr-1" /> Extracted from Card
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div>
                  {renderEditableField('name', 'Full Name', <User size={16} />, 'Enter full name')}
                  {renderEditableField('title', 'Job Title', <Briefcase size={16} />, 'Enter job title')}
                  {renderEditableField('company', 'Company', <Building size={16} />, 'Enter company name')}

                  <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <Tag size={16} className="mr-2" />
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full input"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div>
                  {renderEditableField('email', 'Email Address', <Mail size={16} />, 'name@company.com', 'email')}
                  {renderEditableField('phone', 'Phone Number', <Phone size={16} />, '+1 (123) 456-7890')}
                  {renderEditableField('website', 'Website', <Globe size={16} />, 'company.com')}

                  <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <Briefcase size={16} className="mr-2" />
                      Relationship
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => handleInputChange('relationship', e.target.value)}
                      className="w-full input"
                    >
                      {RELATIONSHIPS.map(rel => (
                        <option key={rel.id} value={rel.id}>{rel.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEditableField('linkedin', 'LinkedIn', <Linkedin size={16} />, 'linkedin.com/in/username')}
                  {renderEditableField('twitter', 'Twitter', <Twitter size={16} />, 'twitter.com/username')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift Preferences Card */}
          <Card>
            <CardHeader border>
              <CardTitle>Gift Preferences</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Add details to get personalized gift suggestions
              </p>
            </CardHeader>

            <CardContent>
              {/* Occasions */}
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar size={16} className="mr-2" />
                  Upcoming Occasions
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.occasions.map(occasion => (
                    <div key={occasion} className="flex items-center bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm">
                      {occasion}
                      <button
                        type="button"
                        onClick={() => handleRemoveOccasion(occasion)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOccasion}
                    onChange={(e) => setNewOccasion(e.target.value)}
                    placeholder="Add occasion (e.g., Birthday on Dec 25)"
                    className="flex-1 input"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOccasion()}
                  />
                  <button
                    type="button"
                    onClick={handleAddOccasion}
                    className="btn btn-secondary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add occasions to get timely gift reminders
                </p>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <DollarSign size={16} className="mr-2" />
                  Gift Budget Range
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {BUDGET_RANGES.map(range => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => handleInputChange('budgetRange', range.id)}
                      className={`p-3 rounded-lg border text-center transition-colors ${formData.budgetRange === range.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      <div className="font-medium">{range.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ${range.min} - ${range.max}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests & Hobbies */}
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Tag size={16} className="mr-2" />
                  Interests & Hobbies
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.interests.map(interest => (
                    <div key={interest} className="flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                      #{interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add interest or hobby"
                    className="flex-1 input"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="btn btn-secondary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add interests to get personalized gift suggestions
                </p>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional information that might help with gift selection..."
                  className="w-full input min-h-[100px]"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-6">
          {/* Profile Preview Card */}
          <Card>
            <CardHeader border>
              <CardTitle>Profile Preview</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-center">
                {profileImage ? (
                  <div className="relative mx-auto mb-4">
                    <img
                      src={profileImage}
                      alt="Business card"
                      className="w-48 h-32 object-cover rounded-lg shadow-md mx-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                  </div>
                ) : (
                  <div className="w-48 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.name || 'Full Name'}
                </h3>
                <p className="text-sm text-gray-600">
                  {formData.title || 'Job Title'}
                </p>
                <p className="text-sm text-gray-500">
                  {formData.company || 'Company Name'}
                </p>

                <div className="mt-4 space-y-2 text-left">
                  {formData.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      {formData.email}
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      {formData.phone}
                    </div>
                  )}
                  {formData.industry && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag size={14} className="mr-2 text-gray-400" />
                      {formData.industry}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <button
                type="button"
                onClick={() => setShowAllFields(!showAllFields)}
                className="w-full btn btn-secondary"
              >
                {showAllFields ? (
                  <>
                    <EyeOff size={16} className="mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <Eye size={16} className="mr-2" />
                    Show All Fields
                  </>
                )}
              </button>
            </CardFooter>
          </Card>

          {/* Action Buttons Card */}
          <Card>
            <CardHeader border>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full btn btn-primary py-3"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Profile & Continue
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipToGifts}
                  disabled={isSaving}
                  className="w-full btn btn-secondary py-3"
                >
                  <Gift size={18} className="mr-2" />
                  Skip to Gift Suggestions
                </button>

                <button
                  onClick={handleBack}
                  className="w-full btn btn-ghost py-3"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Upload
                </button>
              </div>

              {errors.general && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <p className="text-xs text-gray-500 text-center">
                All information is stored locally on your device
              </p>
            </CardFooter>
          </Card>

          {/* Quick Tips Card */}
          <Card>
            <CardHeader border>
              <CardTitle size="sm">Tips for Better Suggestions</CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Complete all fields for personalized suggestions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Add specific interests and hobbies</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Set appropriate budget range</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Add upcoming occasions for timely reminders</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfirmProfile;