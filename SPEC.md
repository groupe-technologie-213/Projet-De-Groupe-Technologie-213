# Specification - Web API
## 1. Objectif

L'objectif de ce projet est de développer une Web API avec Node.js et Express
permettant de gérer des articles et leurs commentaires.

Les données sont stockées temporairement en mémoire dans un objet `db`.

## 2. Terminologie

### Article

Un article possède les propriétés suivantes :

- `id` : identifiant unique de l'article
- `title` : titre de l'article
- `content` : contenu de l'article
- `date` : date de publication
- `author` : auteur de l'article

### Comment

Un commentaire possède les propriétés suivantes :

- `id` : identifiant unique du commentaire
- `timestamp` : date et heure du commentaire
- `content` : contenu du commentaire
- `articleId` : identifiant de l'article auquel le commentaire appartient
- `author` : auteur du commentaire

### articleId

Identifiant permettant d'identifier un article.

### commentId

Identifiant permettant d'identifier un commentaire.

## 3. Modèle de données

### Article

Exemple :

    {
      "id": "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
      "title": "My article",
      "content": "Content of the article.",
      "date": "04/10/2022",
      "author": "Liz Gringer"
    }

### Comment

Exemple :

    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "timestamp": 1664835049,
      "content": "Content of the comment.",
      "articleId": "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
      "author": "Bob McLaren"
    }

## 4. API Endpoints

### 4.1 GET /articles

**Description :**

Retourner la liste de tous les articles.

**Méthode HTTP :** `GET`

**URL :**

    /articles

**Réponse attendue :**

Une liste contenant tous les articles.

---

### 4.2 POST /articles

**Description :**

Créer et ajouter un nouvel article.

**Méthode HTTP :** `POST`

**URL :**

    /articles

**Données attendues :**

Les informations nécessaires à la création d'un article.

**Réponse attendue :**

Le nouvel article créé avec son identifiant.

---

### 4.3 GET /articles/:articleId

**Description :**

Retourner un article spécifique à partir de son identifiant.

**Méthode HTTP :** `GET`

**URL :**

    /articles/:articleId

**Paramètre :**

- `articleId` : identifiant de l'article recherché.

**Exemple :**

    GET /articles/6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b

**Réponse attendue :**

L'article correspondant à `articleId`.

---

### 4.4 GET /articles/:articleId/comments

**Description :**

Retourner tous les commentaires associés à un article.

**Méthode HTTP :** `GET`

**URL :**

    /articles/:articleId/comments

**Paramètre :**

- `articleId` : identifiant de l'article.

**Exemple :**

    GET /articles/6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b/comments

**Réponse attendue :**

Une liste contenant tous les commentaires associés à l'article.

---

### 4.5 POST /articles/:articleId/comments

**Description :**

Ajouter un nouveau commentaire à un article spécifique.

**Méthode HTTP :** `POST`

**URL :**

    /articles/:articleId/comments

**Paramètre :**

- `articleId` : identifiant de l'article auquel le commentaire est associé.

**Données attendues :**

Les informations nécessaires à la création du commentaire.

**Réponse attendue :**

Le commentaire nouvellement créé.

---

### 4.6 GET /articles/:articleId/comments/:commentId

**Description :**

Retourner un commentaire spécifique appartenant à un article.

**Méthode HTTP :** `GET`

**URL :**

    /articles/:articleId/comments/:commentId

**Paramètres :**

- `articleId` : identifiant de l'article.
- `commentId` : identifiant du commentaire.

**Exemple :**

    GET /articles/6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b/comments/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

**Réponse attendue :**

Le commentaire correspondant à `commentId` et appartenant à l'article correspondant à `articleId`.

## 5. Tests

Chaque endpoint devra être testé afin de vérifier que son comportement correspond à la spécification.

Les tests seront réalisés avant l'implémentation conformément à l'approche TDD demandée pour le projet.

## 6. Implémentation

L'API sera développée avec :

- Node.js
- Express
- JavaScript

Les données seront stockées temporairement en mémoire dans l'objet `db`.
