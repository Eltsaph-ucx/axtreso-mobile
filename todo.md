# AXTRESO - TODO Liste

## Architecture & Configuration
- [x] Schémas de base de données (salons, transactions, rapports, utilisateurs)
- [x] Système d'authentification dual (email/password pour gérants, OAuth pour admin)
- [x] Configuration des routes et navigation
- [x] Design system et palette de couleurs (marron/doré/vert/rouge)
- [ ] PWA configuration et service worker

## Interface Gérant
- [x] Dashboard principal (solde jour, solde mois, graphique 10 jours)
- [x] Formulaire ajout encaissement
- [x] Formulaire ajout décaissement
- [x] Historique des transactions avec filtres
- [x] Recherche par mot-clé dans historique
- [x] Modification de transaction
- [x] Suppression de transaction
- [ ] Profil salon (modification infos, changement mot de passe)
- [ ] Gestion notifications (activer/désactiver)
- [x] Statistiques quotidiennes détaillées

## Interface Administrateur
- [ ] Dashboard admin (nombre salons actifs/inactifs, total transactions)
- [ ] Statistiques par salon (nom, ville, soldes, statut)
- [ ] Graphique temporel évolution solde (30/90 jours)
- [ ] Gestion des salons (liste, activation/désactivation, réinitialisation mot de passe)
- [ ] Suppression salon avec confirmation
- [ ] Consultation transactions par salon
- [ ] Génération de rapports (sélection salon, dates, prévisualisation)

## Rapports & Analyses
- [ ] Tableau 5 colonnes (Date, Encaissement, Montant, Décaissement, Montant)
- [ ] Graphique camembert encaissements par poste
- [ ] Tableau récapitulatif encaissements
- [ ] Interprétation automatique encaissements (IA)
- [ ] Graphique camembert top 10 décaissements
- [ ] Tableau récapitulatif décaissements
- [ ] Interprétation automatique décaissements (IA)
- [ ] Section momentum (pics d'encaissements)
- [ ] Section momentum (pics de décaissements)
- [ ] Interprétation momentum (IA)
- [ ] Conseils personnalisés basés sur données
- [ ] Zone éditable pour modifier conseils avant export
- [ ] Commentaires personnalisés avant export

## Exports & Historique
- [ ] Export PDF des rapports
- [ ] Export Excel des rapports
- [ ] Export Word des rapports
- [ ] Prévisualisation complète du rapport
- [ ] Historique des rapports générés
- [ ] Actions sur historique (télécharger, prévisualiser, supprimer)
- [ ] Stockage des rapports dans Manus

## Notifications & PWA
- [ ] Notifications push rappel quotidien
- [ ] Alerte inactivité (2 jours sans transaction)
- [ ] Notification nouveau rapport généré
- [ ] Configuration PWA (manifest.json)
- [ ] Service worker pour mode hors ligne
- [ ] Installation comme application mobile

## Tests & Qualité
- [ ] Tests unitaires authentification
- [ ] Tests unitaires calculs financiers
- [ ] Tests d'intégration génération rapports
- [ ] Tests export formats multi-formats
- [ ] Vérification responsive design
- [ ] Tests accessibilité

## Documentation
- [ ] Guide utilisateur gérant (7 chapitres)
- [ ] Guide utilisateur administrateur (10 chapitres)
- [ ] Documentation API interne
- [ ] Commentaires code
