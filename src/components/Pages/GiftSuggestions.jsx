import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gift, Filter, ArrowLeft, Heart, Share2,
  ExternalLink, CheckCircle, ShoppingBag, Loader2, X
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../Common/Card';
import { useProfiles, useGiftHistory } from '../../hooks/useLocalStorage';
import aiService from '../../services/aiService';
import { useAlert } from '../Common/Alert';

const GiftSuggestions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getProfile } = useProfiles();
  const { addGift } = useGiftHistory();
  const { showAlert } = useAlert();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [givenGifts, setGivenGifts] = useState([]);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 1000,
    minMatch: 70,
    categories: []
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const init = async () => {
      // Get profile from navigation state
      const profileId = location.state?.profileId;

      if (!profileId) {
        // Fallback to most recent profile if available, or redirect
        const recentProfiles = JSON.parse(localStorage.getItem('giftwise_profiles') || '[]');
        if (recentProfiles.length > 0) {
          // Use the most recent one if we lost state (e.g. reload)
          const latest = recentProfiles[recentProfiles.length - 1];
          setProfile(latest);
          await generateIdeas(latest);
        } else {
          navigate('/');
        }
        return;
      }

      const foundProfile = getProfile(profileId);
      if (foundProfile) {
        setProfile(foundProfile);
        await generateIdeas(foundProfile);
      } else {
        showAlert('error', 'Profile not found');
        navigate('/');
      }
    };

    init();
  }, [location.state]);

  // Extract unique categories whenever suggestions change
  useEffect(() => {
    if (suggestions.length > 0) {
      const cats = new Set();
      suggestions.forEach(gift => {
        if (gift.category) cats.add(gift.category);
        // Also check tags for more categories
        if (gift.tags && Array.isArray(gift.tags)) {
          gift.tags.forEach(tag => cats.add(tag));
        }
      });
      setAvailableCategories(Array.from(cats).sort());
    }
  }, [suggestions]);

  const generateIdeas = async (currentProfile) => {
    try {
      setLoading(true);
      const response = await aiService.generateSuggestions(currentProfile);

      if (response && response.suggestions && Array.isArray(response.suggestions)) {
        setSuggestions(response.suggestions);

        if (response.metadata?.model === 'mock-data') {
          showAlert('warning', 'No Gemini API key found or API failed. Using mock data.');
        }
      } else {
        console.warn('AI Service returned unexpected format:', response);
        setSuggestions([]);
        showAlert('warning', 'Received invalid data format from AI service.');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      showAlert('error', 'Failed to generate suggestions. Using offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistToggle = (giftId) => {
    setShortlist(prev => {
      if (prev.includes(giftId)) {
        return prev.filter(id => id !== giftId);
      } else {
        return [...prev, giftId];
      }
    });
  };

  const handleMarkAsGiven = (gift) => {
    if (!profile) return;

    // Add to global gift history (which also updates profile gift count)
    const result = addGift({
      ...gift,
      profileId: profile.id,
      giftName: gift.name, // ensure compatibility with both naming conventions
      occasion: 'General', // Default occasion
      price: gift.price || 0
    });

    if (result) {
      setGivenGifts(prev => [...prev, gift.id]);
      showAlert('success', `Marked "${gift.name}" as given!`);
    } else {
      showAlert('error', 'Failed to save gift history');
    }
  };

  const toggleCategory = (category) => {
    setFilters(prev => {
      const newCats = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCats };
    });
  };

  const filteredSuggestions = suggestions.filter(gift => {
    // Price filter
    if (gift.price > filters.maxPrice) return false;
    // Match score filter
    if (gift.matchScore < filters.minMatch) return false;
    // Category filter (if any selected)
    if (filters.categories.length > 0) {
      const giftCategories = [gift.category, ...(gift.tags || [])];
      const hasMatch = filters.categories.some(cat => giftCategories.includes(cat));
      if (!hasMatch) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-primary-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Curating Gift Ideas...</h2>
        <p className="text-gray-500 mt-2">Analyzing profile and checking trends</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/confirm-profile')}
            className="text-gray-500 hover:text-gray-900 flex items-center mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Profile
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Gift Ideas for {profile.name}
          </h1>
          <p className="text-gray-600">
            Based on their role as <span className="font-medium text-gray-900">{profile.title}</span>
          </p>

          {/* Source Indicator */}
          <div className="mt-2">
            {suggestions.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full border ${suggestions[0].matchScore === 94 && suggestions[0].name.includes('Headphones') // Detect mock data fingerprint
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                {suggestions[0].matchScore === 94 && suggestions[0].name.includes('Headphones')
                  ? '⚠️ Using Mock Data (AI Failed)'
                  : '✨ AI Generated'
                }
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className={`btn ${showFilters ? 'bg-gray-100 ring-2 ring-gray-200' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            Filters {filters.categories.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">{filters.categories.length}</span>}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/history')}
          >
            View History
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-slide-down">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filter Recommendations</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ maxPrice: 1000, minMatch: 70, categories: [] })}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Reset All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Price & Score Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Max Price</span>
                  <span className="font-medium text-gray-900">${filters.maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Min Match Score</span>
                  <span className="font-medium text-gray-900">{filters.minMatch}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={filters.minMatch}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMatch: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <span className="text-sm text-gray-600 block mb-3">Categories & Tags</span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${filters.categories.includes(cat)
                      ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
                {availableCategories.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No categories available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map((gift) => (
            <Card key={gift.id} className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
              {/* Image Area */}
              <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden group">
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold text-gray-900 shadow-sm">
                    ${gift.price}
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <div className={`
                    backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold shadow-sm flex items-center
                    ${gift.matchScore >= 90 ? 'bg-green-100/90 text-green-700' : 'bg-primary-100/90 text-primary-700'}
                  `}>
                    <span className="mr-1">★</span> {gift.matchScore}% Match
                  </div>
                </div>
              </div>

              <CardContent className="flex-grow pt-4">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                    {gift.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {gift.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary-800 italic">
                    "{gift.reasoning}"
                  </p>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {gift.description}
                </p>
              </CardContent>

              <div className="px-6 pb-6 pt-0 mt-auto flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAsGiven(gift)}
                    disabled={givenGifts.includes(gift.id)}
                    className={`flex-1 btn py-2 text-sm ${givenGifts.includes(gift.id)
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'btn-outline'}`}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {givenGifts.includes(gift.id) ? 'Given' : 'Mark Given'}
                  </button>
                  <button
                    onClick={() => handleShortlistToggle(gift.id)}
                    className={`p-2 rounded-lg border transition-colors ${shortlist.includes(gift.id)
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-gray-200 text-gray-400 hover:text-red-500'
                      }`}
                  >
                    <Heart size={20} fill={shortlist.includes(gift.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <a
                  href={gift.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn btn-primary py-2.5 flex items-center justify-center group text-white hover:text-white"
                >
                  Purchase Online
                  <ExternalLink size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Filter size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No matching gifts</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters to see more recommendations</p>
          <button
            onClick={() => setFilters({ maxPrice: 1000, minMatch: 70, categories: [] })}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default GiftSuggestions;