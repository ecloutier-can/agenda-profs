# Générateur d'Agenda Scolaire pour Enseignants

Une application web moderne, légère et performante pour créer, configurer et exporter votre agenda scolaire au format PDF.

## 🚀 Fonctionnalités

- **Configuration Flexible** : Définissez votre année scolaire, les dates de début/fin et le nombre de périodes par jour.
- **Cycles de Rotation** : Support des cycles de 5, 9, 10, 12 et 15 jours.
- **Gestion Intelligente** : Rotation automatique du cycle sur les jours ouvrables, avec gestion des congés et journées pédagogiques.
- **Corrections Manuelles** : Ajustez manuellement le jour du cycle pour n'importe quelle date ; l'agenda se recalcule automatiquement à partir de ce point.
- **Couleurs & Légende** : Attribuez des couleurs à vos matières ou types d'événements pour une lecture facilitée.
- **Export PDF** : Générez un PDF professionnel (1 semaine par page) prêt à l'impression.
- **Zéro Base de Données** : Vos données restent chez vous. Sauvegarde automatique dans le navigateur et export/import via fichier `.agenda`.

## 🛠 Installation et Déploiement

Cette application est **100% frontend** (HTML, CSS, JS). Aucun serveur n'est nécessaire.

### Localement
Ouvrez simplement le fichier `index.html` dans votre navigateur préféré.

### Déploiement sur GitHub Pages
1. Créez un nouveau dépôt sur GitHub.
2. Téléchargez les fichiers de l'application (`index.html`, `style.css`, `app.js`, `calendar.js`, `storage.js`, `pdf-generator.js`).
3. Allez dans **Settings > Pages**.
4. Dans **Build and deployment**, choisissez la branche `main` et cliquez sur **Save**.
5. Votre application sera disponible à l'adresse : `https://[pseudo].github.io/[nom-du-depot]/`.

## 📖 Mode d'emploi

1. **Configuration** : Entrez les dates de votre année scolaire dans la barre latérale gauche.
2. **Horaire** : Configurez votre grille type dans l'onglet "Horaire du Cycle".
3. **Événements** : Ajoutez vos fériés et journées pédagogiques.
4. **Légende** : Créez vos catégories de cours et choisissez leurs couleurs.
5. **Aperçu** : Vérifiez le résultat dans l'onglet "Aperçu de l'Agenda". Si un décalage survient, utilisez le menu déroulant "Jour" pour corriger une date précise.
6. **PDF** : Cliquez sur "Générer le PDF" pour télécharger votre agenda final.
7. **Sauvegarde** : Exportez régulièrement votre configuration via le bouton "Exporter (.agenda)".

## 📦 Bibliothèques utilisées
- [jsPDF](https://github.com/parallax/jsPDF) : Génération de documents PDF.
- [Inter Font](https://fonts.google.com/specimen/Inter) : Typographie moderne.

---
Développé avec ❤️ pour faciliter la vie des enseignants.
