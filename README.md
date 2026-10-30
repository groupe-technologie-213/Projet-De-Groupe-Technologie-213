# Projet-De-Groupe-Technologies-web-avanc-es-

## 🚀 Démarrage rapide

### Prérequis

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) >= 18 *(adapter selon la stack)*
- *(autres dépendances : Docker, Python, etc.)*

### Cloner le dépôt

```bash
git clone [https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git](https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git)
cd <projet>
```

### Installer les dépendances

```bash
npm install
```

### Configurer l'environnement

```bash
cp .env.example .env
```

Renseignez ensuite les variables dans `.env`.

### Lancer le projet

```bash
npm run dev
```

## 🤝 Contribuer

1. **Forkez** le dépôt et clonez votre fork :
```bash
   git clone https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git
```
2. **Ajoutez le dépôt d'origine** comme remote :
```bash
   git remote add upstream https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git
```
3. **Créez une branche** depuis `main` :
```bash
   git checkout -b feature/YOURNAME
```
4. **Faites vos modifications** et committez avec un message clair :
```bash
   git commit -m "feat: ajoute ma fonctionnalité"
```
5. **Poussez** la branche :
```bash
   git push origin feature/YOURNAME
```
6. **Ouvrez une Pull Request** vers `main` en décrivant vos changements.

### Conventions

- Branches : `feature/...`, `fix/...`, `docs/...`
- Commits : [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat:`, `fix:`, `docs:`...)
- Lancez les tests et le linter avant chaque PR :
```bash
  npm test
  npm run lint
```
