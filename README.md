# 🏡 ImmoMaroc - Plateforme Immobilière Intelligente

![ImmoMaroc Preview](/public/placeholder.jpg) ImmoMaroc est une plateforme immobilière moderne (PropTech) conçue pour le marché marocain. Elle connecte les propriétaires, les agences immobilières et les clients à la recherche du bien idéal. 

L'application intègre des fonctionnalités avancées telles qu'un moteur de recherche basé sur le traitement du langage naturel (NLP) et un assistant virtuel (Chatbot), le tout entièrement multilingue (Français, Anglais, Arabe).

---

## ✨ Fonctionnalités Principales

* 🌍 **Multilingue & RTL** : Support natif du Français, de l'Anglais et de l'Arabe avec gestion automatique du sens de lecture (Right-To-Left) grâce à `next-intl`.
* 🤖 **Chatbot Intelligent** : Un assistant virtuel intégré capable de comprendre les intentions des utilisateurs dans les 3 langues (recherche, contact, publication) et de suggérer des biens en temps réel.
* 🔍 **Smart Search (NLP)** : Moteur de recherche avancé. Tapez *"Villa avec piscine à Marrakech pour moins de 1500000"* ou *"فيلا بمسبح في مراكش بأقل 1500000"* et l'algorithme extrait automatiquement la ville, le type, les équipements et le budget.
* 📊 **Tableaux de bord (Dashboards)** : Espaces dédiés et sécurisés pour les Administrateurs, les Agences et les Clients avec statistiques détaillées.
* 💬 **Messagerie Intégrée** : Système de discussion en temps réel entre les chercheurs et les annonceurs.
* 📱 **Design Responsive** : Interface entièrement optimisée pour mobile et desktop avec Tailwind CSS.
* 🚀 **SEO Optimisé** : Génération dynamique des balises Meta (OpenGraph) pour chaque annonce immobilière afin d'optimiser le partage sur WhatsApp et les réseaux sociaux.

---

## 🛠️ Stack Technique

### Frontend
* **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
* **Styling** : [Tailwind CSS](https://tailwindcss.com/)
* **Icônes** : [Lucide React](https://lucide.dev/)
* **Internationalisation** : [next-intl](https://next-intl-docs.vercel.app/)
* **Composants UI** : Radix UI / Shadcn (adapté)

### Backend
* **Framework** : [Laravel](https://laravel.com/) (PHP)
* **Base de données** : MySQL
* **API** : RESTful API pour la communication avec le frontend.

---

## ⚙️ Installation & Lancement en Local

### Prérequis
* Node.js (v18+)
* PHP (v8.1+)
* Composer
* MySQL

### 1. Configuration du Backend (Laravel)
```bash
# Cloner le dépôt (si backend séparé)
cd backend

# Installer les dépendances PHP
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé de l'application
php artisan key:generate

# Configurer la base de données dans le fichier .env puis lancer les migrations
php artisan migrate --seed

# Lancer le serveur local (généralement sur [http://127.0.0.1:8000](http://127.0.0.1:8000))
php artisan serve
