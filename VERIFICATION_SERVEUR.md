# ✅ Checklist de Démarrage et de Connectivité du Serveur (Port 3001)

Ce guide vérifie les trois exigences critiques qui ont été modifiées dans **`server/index.js`** pour garantir que votre serveur Node.js fonctionne correctement et peut communiquer avec votre client Codespaces.

---

## 1. ⚙️ Exigence : Configuration de l'Hôte (Écoute Réseau)

**Objectif :** S'assurer que le serveur est accessible par le tunnel Codespaces, en écoutant sur toutes les interfaces réseau.

### Fichier à Vérifier : `server/index.js`

| Point de Contrôle | Code Correct | État |
| :--- | :--- | :--- |
| **Le serveur doit écouter sur `0.0.0.0`.** | `const HOST = '0.0.0.0';` | **[ ] OK** |
| **La fonction `listen` utilise la variable `HOST`.** | `server.listen(PORT, HOST, () => { ... });` | **[ ] OK** |

> 💡 **Conséquence d'un échec :** Erreur `net::ERR_CONNECTION_REFUSED` ou le serveur ne répond pas car il n'est pas exposé correctement.

---

## 2. 🔑 Exigence : Configuration CORS (Autorisation de Domaine)

**Objectif :** Autoriser le domaine dynamique HTTPS de votre client Codespaces à se connecter au serveur, prévenant ainsi le blocage de requête multiorigine.

### Fichier à Vérifier : `server/index.js`

| Point de Contrôle | Code Correct | État |
| :--- | :--- | :--- |
| **Le serveur doit explicitement autoriser le domaine (l'origine).** | `origin: '*'` | **[ ] OK** |
| **L'option CORS est configurée dans l'objet `new Server(...)`.** | La configuration `cors: { ... }` doit être présente et utiliser `origin: '*'`. | **[ ] OK** |

```javascript
// Extrait de server/index.js (Le bloc CORS doit être ainsi)
const io = new Server(server, {
  cors: {
    origin: '*', // ⬅️ Le joker est essentiel
    methods: ['GET', 'POST'],
    credentials: true,
  },
});