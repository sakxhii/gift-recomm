import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload, Users, Gift, TrendingUp, Clock,
  Star, Calendar, ArrowUpRight, Plus, Download
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard, ActionCard } from '../Common/Card';
import StorageStatus from '../Common/StorageStatus';
import { useAppStats, useProfiles } from '../../hooks/useLocalStorage';

import storage from '../../utils/storage';

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, refreshStats, isLoading } = useAppStats();
  const { profiles } = useProfiles();
  const [recentActivity, setRecentActivity] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    try {
      const result = storage.exportAllData();

      if (result.success && result.url) {
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", result.url);
        downloadAnchorNode.setAttribute("download", result.fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else {
        alert('Export failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Process recent activity
  useEffect(() => {
    const activities = [];

    // Add recent gifts
    stats.recentGifts.slice(0, 3).forEach(gift => {
      const profile = profiles.find(p => p.id === gift.profileId);
      activities.push({
        id: gift.id,
        type: 'gift',
        title: `Gifted ${gift.giftName}`,
        description: profile?.name || 'Someone',
        time: gift.givenAt,
        icon: Gift
      });
    });

    // Add recent profiles
    const recentProfiles = profiles
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);

    recentProfiles.forEach(profile => {
      activities.push({
        id: profile.id,
        type: 'profile',
        title: `Added ${profile.name}`,
        description: profile.title || 'Contact',
        time: profile.createdAt,
        icon: Users
      });
    });

    // Sort by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivity(activities.slice(0, 5));
  }, [stats, profiles]);

  const QuickAction = ({ title, description, icon, link, color = 'primary' }) => (
    <Link to={link} className="block">
      <Card hover className="h-full">
        <CardContent className="text-center">
          <div className={`inline-flex p-3 rounded-lg mb-4 ${color === 'primary' ? 'bg-primary-50 text-primary-600' :
            color === 'green' ? 'bg-green-50 text-green-600' :
              color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'
            }`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Welcome to GiftWise AI</h1>
            <p className="text-primary-100 opacity-90 mb-4">
              Your intelligent gift assistant for professional relationships.
              All data is securely stored on your device.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm">Local Mode Active</span>
              </div>
              <div className="text-sm opacity-80">
                {profiles.length} profiles • {stats.totalGiftsGiven} gifts tracked
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <Link
              to="/upload"
              className="inline-flex items-center bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-all shadow-xl-soft"
            >
              <Plus size={20} className="mr-2" />
              Add New Contact
            </Link>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Profiles"
          value={stats.totalProfiles}
          change={profiles.length > 0 ? "+2 this week" : null}
          icon={<Users size={24} />}
          color="primary"
        />
        <StatCard
          title="Gifts Given"
          value={stats.totalGiftsGiven}
          change={stats.totalGiftsGiven > 0 ? "+5 this month" : null}
          icon={<Gift size={24} />}
          color="green"
        />
        <StatCard
          title="Success Rate"
          value="94%"
          change="+2.3%"
          icon={<TrendingUp size={24} />}
          color="blue"
        />
        <StatCard
          title="Avg. Gift Value"
          value="$120"
          change="+$15"
          icon={<Star size={24} />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <Link
            to="/upload"
            className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center"
          >
            View all actions
            <ArrowUpRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Upload Business Card"
            description="Add a new contact from their card"
            icon={<Upload size={24} />}
            link="/upload"
            color="primary"
          />
          <QuickAction
            title="View All Profiles"
            description={`Browse ${profiles.length} contacts`}
            icon={<Users size={24} />}
            link="/profiles"
            color="green"
          />
          <QuickAction
            title="Gift History"
            description={`Track ${stats.totalGiftsGiven} gifts`}
            icon={<Gift size={24} />}
            link="/history"
            color="purple"
          />
        </div>
      </div>

      {/* Storage Status */}
      <StorageStatus />

      {/* Recent Activity */}
      <Card>
        <CardHeader border>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <button
              onClick={refreshStats}
              disabled={isLoading}
              className="text-sm font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0 mr-4">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Icon size={18} className="text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(activity.time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-lg bg-gray-100 mb-4">
                <Clock size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-2">Start by uploading your first business card</p>
              <Link
                to="/upload"
                className="inline-flex items-center mt-4 text-primary-600 hover:text-primary-800 font-medium"
              >
                <Upload size={16} className="mr-2" />
                Upload First Card
              </Link>
            </div>
          )}
        </CardContent>

        {recentActivity.length > 0 && (
          <CardFooter>
            <Link
              to="/history"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 w-full text-center"
            >
              View full activity log
            </Link>
          </CardFooter>
        )}
      </Card>

      {/* Top Profiles */}
      {stats.topProfiles && stats.topProfiles.length > 0 && (
        <Card>
          <CardHeader border>
            <CardTitle>Frequently Gifted</CardTitle>
            <CardDescription>Contacts you've gifted most often</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {stats.topProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 mr-4">
                    <div className="avatar avatar-md">
                      {getInitials(profile.name)}
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {profile.title} {profile.company ? `• ${profile.company}` : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{profile.giftCount || 0} gifts</div>
                      <div className="text-xs text-gray-500">
                        {profile.lastGiftDate ? formatDate(profile.lastGiftDate) : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips & Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionCard
          title="Upcoming Occasions"
          description="View birthdays, anniversaries, and other important dates"
          icon={<Calendar size={24} />}
          actionText="View Calendar"
          onClick={() => navigate('/profiles')}
          variant="primary"
        />

        <ActionCard
          title="Backup Your Data"
          description="Export your data to prevent loss. Recommended weekly."
          icon={<Download size={24} />}
          actionText={isBackingUp ? "Backing up..." : "Backup Now"}
          onClick={handleBackup}
          variant="warning"
        />
      </div>
    </div>
  );
};

export default Dashboard;