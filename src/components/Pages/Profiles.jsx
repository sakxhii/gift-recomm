import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, UserPlus, Mail, Phone, Building, ExternalLink, Gift, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardContent, CardFooter } from '../Common/Card';
import { useProfiles } from '../../hooks/useLocalStorage';
import { useAlert } from '../Common/Alert';
import ConfirmationModal from '../Common/ConfirmationModal';

const Profiles = () => {
  const navigate = useNavigate();
  const { profiles, deleteProfile } = useProfiles();
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, profileId: null });

  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(searchLower) ||
      profile.company?.toLowerCase().includes(searchLower) ||
      profile.title?.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, profileId: id });
  };

  const confirmDelete = () => {
    if (deleteModal.profileId) {
      deleteProfile(deleteModal.profileId);
      showAlert('success', 'Profile deleted successfully');
      setDeleteModal({ isOpen: false, profileId: null });
    }
  };

  const handleProfileClick = (id) => {
    navigate('/gift-suggestions', { state: { profileId: id } });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Profiles</h1>
            <p className="text-gray-600">
              Manage and view all your saved contacts ({profiles.length})
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="btn btn-primary"
          >
            <UserPlus size={18} className="mr-2" />
            Add New Profile
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search profiles by name, company, or title..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              <span>Filters</span>
            </button> */}
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div key={profile.id} onClick={() => handleProfileClick(profile.id)} className="cursor-pointer">
              <Card hover className="h-full flex flex-col">
                <CardContent className="p-6 flex-grow">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      {profile.image ? (
                        <img
                          src={profile.image}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                          <Users size={24} className="text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{profile.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{profile.title}</p>
                      <p className="text-sm text-gray-500 truncate">{profile.company}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(e, profile.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {profile.email && (
                      <div className="flex items-center text-sm text-gray-600 truncate">
                        <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center text-sm text-gray-600 truncate">
                        <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.phone}</span>
                      </div>
                    )}
                    {profile.industry && (
                      <div className="flex items-center text-sm text-gray-600 truncate">
                        <Building size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.industry}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs rounded-b-xl">
                  <span className="text-gray-500">
                    {profile.giftHistory?.length || 0} gifts given
                  </span>
                  <span className="text-primary-600 font-medium flex items-center">
                    Get Suggestions <ExternalLink size={12} className="ml-1" />
                  </span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Users size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profiles Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? `No matches for "${searchTerm}"` : "Start by adding your first contact"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/upload')}
              className="btn btn-primary"
            >
              <UserPlus size={18} className="mr-2" />
              Add Your First Profile
            </button>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        confirmText="Delete Profile"
        isDanger={true}
      />
    </div>
  );
};

export default Profiles;