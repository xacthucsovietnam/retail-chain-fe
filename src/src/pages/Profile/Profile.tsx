import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Pencil,
  UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserProfile } from '../../services/profile';
import type { UserProfile } from '../../services/profile';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setError('User ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getUserProfile(user.id);
        setProfile(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Profile Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            Your profile information could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                  }}
                />
              ) : (
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              )}
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-sm text-gray-500">{profile.fullName}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">Date of Birth</span>
                </div>
                <p className="text-lg text-gray-900">{formatDate(profile.dateOfBirth)}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <UserCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Gender</span>
                </div>
                <p className="text-lg text-gray-900">{profile.gender || 'Not specified'}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">Phone</span>
                </div>
                <p className="text-lg text-gray-900">{profile.phone || 'Not set'}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-lg text-gray-900">{profile.email || 'Not set'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">Address</span>
                </div>
                <p className="text-lg text-gray-900">{profile.address || 'Not set'}</p>
              </div>

              {profile.comment && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">Notes</span>
                  </div>
                  <p className="text-lg text-gray-900 whitespace-pre-line">{profile.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}