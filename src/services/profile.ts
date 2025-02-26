import api from './axiosClient';
import { ObjectId } from './types';

export interface UserProfile {
  id: string;
  name: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  comment: string;
  picture: string;
  gender: string;
}

export interface UpdateProfile {
  id: string;
  name: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  comment: string;
  picture: string;
  gender: string;
}

/**
 * Fetches user profile information
 * @param userId The ID of the user to fetch
 * @returns Promise resolving to user profile data
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const request = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [
      {
        _type: 'XTSObjectId',
        dataType: 'XTSCounterparty',
        id: userId,
        presentation: '',
        url: ''
      }
    ],
    columnSet: []
  };

  try {
    const response = await api.post('', request);

    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid user profile response format');
    }

    const user = response.data.objects[0];

    return {
      id: user.objectId?.id || '',
      name: user.description || '',
      fullName: user.descriptionFull || '',
      dateOfBirth: user.dateOfBirth || '',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
      comment: user.comment || '',
      picture: user.picture?.url || '',
      gender: user.gender?.presentation || ''
    };
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
};

/**
 * Updates user profile information
 * @param userId The ID of the user to update
 * @param data The profile data to update
 * @returns Promise resolving when update is complete
 */
export const updateUserProfile = async (userId: string, data: UpdateProfile): Promise<void> => {
  const request = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSCounterparty',
        dateOfBirth: data.dateOfBirth,
        _isFullData: true,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterparty',
          id: userId,
          presentation: data.name,
          url: ''
        },
        description: data.name,
        descriptionFull: data.fullName,
        counterpartyKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterpartyKind',
          id: 'Individual',
          presentation: 'Cá nhân',
          url: ''
        },
        gender: {
          _type: 'XTSObjectId',
          dataType: 'XTSGender',
          id: data.gender,
          presentation: '',
          url: ''
        },
        comment: data.comment,
        invalid: false,
        mainInfo: `${data.fullName}\n${data.phone}\n${data.email}\n${data.comment}`,
        customer: true,
        vendor: true,
        phone: data.phone,
        email: data.email,
        address: data.address,
        picture: {
          _type: 'XTSObjectId',
          dataType: '',
          id: '',
          presentation: '',
          url: data.picture
        }
      }
    ]
  };

  try {
    const response = await api.post('', request);

    if (!response.data?.success) {
      throw new Error('Profile update failed');
    }
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw new Error('Failed to update user profile');
  }
};