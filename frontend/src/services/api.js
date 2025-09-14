import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.detail || 'Server error occurred');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

// Serious Mode API calls
export const seriousModeDetection = async (formData) => {
  try {
    const response = await api.post('/serious-mode', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Serious mode detection error:', error);
    throw error;
  }
};

// Fun Mode API calls
export const funModeDetection = async (formData) => {
  try {
    const response = await api.post('/fun-mode', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Fun mode detection error:', error);
    throw error;
  }
};

// Quest management
export const completeQuest = async (questId, userId = 'default_user') => {
  try {
    const response = await api.post('/complete-quest', null, {
      params: { quest_id: questId, user_id: userId },
    });
    return response.data;
  } catch (error) {
    console.error('Complete quest error:', error);
    throw error;
  }
};

// Betting management
export const placeBet = async (betData) => {
  try {
    const response = await api.post('/place-bet', {
      ...betData,
      user_id: betData.user_id || 'default_user',
    });
    return response.data;
  } catch (error) {
    console.error('Place bet error:', error);
    throw error;
  }
};

export const resolveBet = async (betId, won, userId = 'default_user') => {
  try {
    const response = await api.post('/resolve-bet', null, {
      params: { bet_id: betId, won: won, user_id: userId },
    });
    return response.data;
  } catch (error) {
    console.error('Resolve bet error:', error);
    throw error;
  }
};

export const getMoneyStats = async (userId = 'default_user') => {
  try {
    const response = await api.get(`/user/${userId}/money-stats`);
    return response.data;
  } catch (error) {
    console.error('Get money stats error:', error);
    throw error;
  }
};

// User data
export const getUserBalance = async (userId = 'default_user') => {
  try {
    const response = await api.get(`/user/${userId}/balance`);
    return response.data;
  } catch (error) {
    console.error('Get user balance error:', error);
    throw error;
  }
};

export const getUserQuests = async (userId = 'default_user') => {
  try {
    const response = await api.get(`/user/${userId}/quests`);
    return response.data;
  } catch (error) {
    console.error('Get user quests error:', error);
    throw error;
  }
};

export const getUserBets = async (userId = 'default_user') => {
  try {
    const response = await api.get(`/user/${userId}/bets`);
    return response.data;
  } catch (error) {
    console.error('Get user bets error:', error);
    throw error;
  }
};

export const generateQuestBatch = async (userId = 'default_user') => {
  try {
    const response = await api.post(`/user/${userId}/quest-batch`);
    return response.data;
  } catch (error) {
    console.error('Generate quest batch error:', error);
    throw error;
  }
};

export const getPendingQuests = async (userId = 'default_user') => {
  try {
    const response = await api.get(`/user/${userId}/pending-quests`);
    return response.data;
  } catch (error) {
    console.error('Get pending quests error:', error);
    throw error;
  }
};

export const acceptQuest = async (questId, userId = 'default_user') => {
  try {
    const response = await api.post(`/user/${userId}/quest/${questId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Accept quest error:', error);
    throw error;
  }
};

export const rejectQuest = async (questId, userId = 'default_user') => {
  try {
    const response = await api.post(`/user/${userId}/quest/${questId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Reject quest error:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

export default api;
