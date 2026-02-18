import axios from 'axios';

// 1. Création de l'instance Axios
// On définit l'URL de base de ton backend Laravel
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 2. Intercepteur de Requête (Request Interceptor)
// C'est ici que la magie opère : avant chaque envoi, on vérifie si un token existe
api.interceptors.request.use(
    (config) => {
        // On vérifie qu'on est bien côté client (navigateur) car localStorage n'existe pas côté serveur
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            
            // Si un token est trouvé, on l'ajoute aux en-têtes (Headers)
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Intercepteur de Réponse (Response Interceptor) - OPTIONNEL
// Utile pour gérer les erreurs globales, comme une session expirée
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Si le backend renvoie 401 (Non autorisé), c'est que le token est invalide ou expiré
        if (error.response && error.response.status === 401) {
            // On peut déconnecter l'utilisateur proprement
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Optionnel : Rediriger vers la page de connexion
                // window.location.href = '/connexion';
            }
        }
        return Promise.reject(error);
    }
);

export default api;