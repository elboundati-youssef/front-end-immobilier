import api from './api';

export const authService = {
    // Inscription
    register: async (userData: any) => {
        const response = await api.post('/register', userData);
        return response.data;
    },

    // Connexion
    login: async (credentials: any) => {
        const response = await api.post('/login', credentials);
        return response.data;
    },

    // Déconnexion
    logout: async () => {
        const response = await api.post('/logout');
        return response.data;
    },

    // Récupérer l'utilisateur courant
    getProfile: async () => {
        const response = await api.get('/user');
        return response.data;
    }
};