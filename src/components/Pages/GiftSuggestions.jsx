import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gift, Filter, ArrowLeft, Heart, Share2,
  ExternalLink, CheckCircle, ShoppingBag, Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../Common/Card';
import { useProfiles } from '../../hooks/useLocalStorage';
import aiService from '../../services/aiService';
import { useAlert } from '../Common/Alert';

const GiftSuggestions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getProfile, updateProfile } = useProfiles();
  const { showAlert } = useAlert();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [shortlist, setShortlist] = useState([]);

  // DEBUG: Direct API Test
  useEffect(() => {
    const testAPI = async () => {
      const settings = localStorage.getItem('giftwise_settings');
      if (!settings) {
        alert('No settings found');
        return;
      }

      const parsed = JSON.parse(decodeURIComponent(atob(settings)));
      const apiKey = parsed.geminiApiKey;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Suggest 3 gifts for a Software Engineer. Return valid JSON." }] }]
          })
        });

        const text = await response.text();
        console.log('DIRECT API RESULT:', text);

        if (!response.ok) {
          alert(`DIRECT API FAILURE: ${response.status}\n${text}`);
        } else {
          const data = JSON.parse(text);
          const aiText = data.candidates[0].content.parts[0].text;
          alert(`SUCCESS! API WORKED!\nResponse: ${aiText.substring(0, 100)}...`);

          // If this worked, the issue is in my Service Class logic, not the API/Key.
          // Reloading normal flow...
          setLoading(true);
          const result = await aiService.generateSuggestions(profile); // Try normal again
        }
      } catch (e) {
        alert(`NETWORK ERROR: ${e.message}`);
      }
    };

    if (profile) testAPI();
  }, [profile]);

  /*
      // ORIGINAL LOGIC COMMENTED OUT FOR DEBUGGING
      useEffect(() => {
      const init = async () => {
        // ... logic ...
      };
      init();
      }, ...);
  */

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

    // Add to profile's gift history
    const givenGift = {
      ...gift,
      givenDate: new Date().toISOString(),
      status: 'given'
    };

    const updatedHistory = [...(profile.giftHistory || []), givenGift];
    updateProfile(profile.id, { giftHistory: updatedHistory });

    showAlert('success', `Marked "${gift.name}" as given!`);

    // Ideally navigate to history or show confirmation
  };

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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
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
          <button className="btn btn-secondary">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/history')}
          >
            View History
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((gift) => (
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
                <div className="bg-primary-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center">
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
                  className="flex-1 btn btn-outline py-2 text-sm"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Mark Given
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
              <button className="w-full btn btn-primary py-2.5 flex items-center justify-center group">
                Purchase Online
                <ExternalLink size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GiftSuggestions;