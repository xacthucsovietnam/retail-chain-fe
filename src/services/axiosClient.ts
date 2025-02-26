import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7',
        'Content-Type': 'text/plain;charset=UTF-8',
        'Origin': window.location.origin,
        'Referer': window.location.origin + '/',
        'Priority': 'u=1, i',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
    },
    timeout: 30000,
    withCredentials: true
});

api.interceptors.response.use(
    (response) => {
        if (!response.data) {
            throw new Error('Empty response received from server');
        }
        return response;
    },
    (error) => {
        if (axios.isCancel(error)) {
            throw new Error('Request was cancelled');
        }

        if (!error.response) {
            console.error('Network error:', error.message);
            throw new Error('Network error. Please check your connection and try again.');
        }

        if (error.response.status === 401) {
            console.error('Authentication error:', error.response.data);
            throw new Error('Authentication failed. Please check your credentials.');
        }

        if (error.response.status === 404) {
            console.error('Resource not found:', error.response.data);
            throw new Error('The requested resource was not found.');
        }

        if (error.response.status >= 500) {
            console.error('Server error:', error.response.data);
            throw new Error('Server error. Please try again later.');
        }

        console.error('API error:', error.response?.data || error.message);
        throw error;
    }
);

export default api;