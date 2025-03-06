import axios from 'axios';

const API_URL = 'https://app.xts.vn/dungbaby-service/hs/apps/execute/xts';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'text/plain',
    },
    timeout: 30000,
});

api.interceptors.response.use(
  (response) => {
    if (!response.data) {
      throw new Error('Empty response received from server');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;