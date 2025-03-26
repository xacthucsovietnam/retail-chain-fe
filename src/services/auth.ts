// src/services/auth.ts
import { v4 as uuidv4 } from 'uuid';
import api from './axiosClient';
import { setSession, clearSession } from '../utils/storage';

interface LoginRequest {
    _type: string;
    _dbId: string;
    _msgId: string;
    deviceId: string;
    userToken: string;
    userName: string;
    password: string;
    telegramId: string;
    zaloId: string;
    phone: string;
    otp: string;
    deviceInfo: string;
    fullName: string;
}

interface LogoutRequest {
    _type: string;
    _dbId: string;
    _msgId: string;
    deviceId: string;
    user: any;
    externalAccount: null;
}

export const login = async (username: string, password: string) => {
    const loginData: LoginRequest = {
        _type: 'XTSSignInRequest',
        _dbId: '',
        _msgId: '',
        deviceId: uuidv4(),
        userToken: '',
        userName: username.trim(),
        password: password.trim(),
        telegramId: '',
        zaloId: '',
        phone: '',
        otp: '',
        deviceInfo: '',
        fullName: ''
    };

    try {
        const response = await api.post('', loginData);

        if (!response.data || !response.data.user) {
            throw new Error('Invalid response from server');
        }

        // Lưu toàn bộ response.data (XTSSignInResponse) vào localStorage
        setSession(response.data);

        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Login failed');
    }
};

export const logout = async (user: any) => {
    const logoutData: LogoutRequest = {
        _type: 'XTSSignOutRequest',
        _dbId: '',
        _msgId: '',
        deviceId: uuidv4(),
        user: user,
        externalAccount: null
    };

    try {
        const response = await api.post('', logoutData);
        clearSession();
        return response.data;
    } catch (error) {
        console.error('Logout error:', error);
        clearSession();
        throw new Error('Logout failed');
    }
};