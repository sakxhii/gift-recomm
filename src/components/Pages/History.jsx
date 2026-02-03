import React from 'react';
import { Gift, Calendar, Filter, TrendingUp, DollarSign, CheckCircle, Users } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../Common/Card';
import { useAppStats, useGiftHistory, useProfiles } from '../../hooks/useLocalStorage';

const History = () => {
  const { stats } = useAppStats();
  const { history } = useGiftHistory();
  const { profiles } = useProfiles();

  const getProfileName = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Unknown Contact';
  };

  const getProfileCompany = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile ? profile.company : '';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gift History</h1>
        <p className="text-gray-600">
          Track all gifts you've given and received feedback
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gifts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalGiftsGiven || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary-50">
                <Gift size={20} className="text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats.totalSpent || 0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">94%*</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Gift</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalGiftsGiven ? formatPrice(stats.totalSpent / stats.totalGiftsGiven) : '$0'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <CheckCircle size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search (Placeholder functionality) */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="input">
                  <option>All Occasions</option>
                  <option>Birthday</option>
                  <option>Anniversary</option>
                  <option>Holiday</option>
                </select>
                <select className="input">
                  <option>All Years</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                </select>
                <select className="input">
                  <option>All Relationships</option>
                  <option>Colleague</option>
                  <option>Client</option>
                  <option>Friend</option>
                </select>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              <span>More Filters</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Gift History List */}
      <Card>
        <CardHeader border>
          <CardTitle>Recent Gifts</CardTitle>
        </CardHeader>

        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((gift) => (
                <div key={gift.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 mr-4">
                      <Gift size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{gift.name || gift.giftName}</h4>
                      <p className="text-sm text-gray-600">
                        Given to {getProfileName(gift.profileId)} • {gift.occasion || 'General'}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Given
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <Calendar size={12} className="text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {new Date(gift.givenAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{gift.price ? formatPrice(gift.price) : '-'}</p>
                    <p className="text-sm text-gray-500">{getProfileCompany(gift.profileId)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Gift size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gift History Yet</h3>
              <p className="text-gray-600">
                Start by giving your first gift to track it here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;