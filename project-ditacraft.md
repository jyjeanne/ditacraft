# DitaCraft - Plugin VS Code pour Éditer et Publier des Fichiers DITA

## Présentation du Projet

**Nom du Plugin VS Code** : DitaCraft , best way to edit and plublish your dita file 
**Fonctionnalités principales** :
- Édition des fichiers DITA (Topic, Bookmap, Ditamap).
- Aide à la saisie , autocomplétion
- Vérification de la conformité syntaxique des fichiers avec la norme DITA.
- Publication en plusieurs formats (HTML5, PDF, etc.) via DITA OT.
- Visualisation simultanée du code DITA et du rendu HTML5 dans VS Code.

## Outils et Librairies

- **Node.js** : Version recommandée : v16.x ou supérieure
- **VS Code API** : Dernière version stable
- **DITA OT** : Version recommandée : DITA OT 3.6 ou supérieure
- **XSLT Processor** : Pour la transformation XML
- **Language Server Protocol (LSP)** : Pour la validation syntaxique

## **2. Prérequis et versions recommandées**
   Outil/Librairie               | Version recommandée | Description                                                                 |
 |-------------------------------|---------------------|-----------------------------------------------------------------------------|
 | Node.js                       | 18.x ou 20.x        | Environnement d'exécution pour le plugin.                                  |
 | VS Code                       | 1.80+               | Éditeur de code.                                                           |
 | Yeoman                        | 5.0+                | Générateur de squelette pour les plugins VS Code.                          |
 | generator-code                | 2.0+                | Générateur officiel de Microsoft pour les extensions VS Code.              |
 | DITA-OT                       | 4.2.1               | Outil de transformation DITA (HTML5, PDF, etc.).                         |
 | xmllint                       | 2.10+               | Outil de validation XML (fournis par libxml2).                             |
 | vscode-languageclient         | 8.1+                | Pour intégrer un serveur de langage (LSP) si nécessaire.                 |
 | xml-validator                 | 1.0+                | Alternative à xmllint pour valider les fichiers XML/DITA.                 |
 | TypeScript                    | 5.0+                | Langage de développement du plugin.                                        |
 | VS Code Extension API         | Incluse dans VS Code| API pour interagir avec VS Code.                                           |
 | Express.js (optionnel)        | 4.18+               | Pour servir le rendu HTML5 via un serveur local.                          |



## Exemple de workflow utilisateur

1. L'utilisateur ouvre un fichier .dita dans VS Code.
2. Le plugin valide la syntaxe et affiche les erreurs.
3. L'utilisateur choisi le format de sortie dans un liste déroulant et clique sur un bouton "Publish".
4. Le plugin appelle DITA-OT, une bare de progression s'affiche et quand elle atteind 100% cela génère le rendu.
5. Le rendu s'affiche dans une Webview à côté du code si le format de sortie est HTML sinon pour les outils format un répertoire de sortie est indiqué.


## **3. Cas d'utilisation**
 | Cas d'utilisation                          | Description                                                                                     |
 |--------------------------------------------|-------------------------------------------------------------------------------------------------|
 | Édition de fichiers DITA                  | Colorisation syntaxique et autocomplétion pour les fichiers `.dita`, `.ditamap`, `.bookmap`.   |
 | Validation de la syntaxe DITA             | Vérification en temps réel ou à la demande de la conformité des fichiers DITA.                |
 | Publication multi-format                   | Génération de fichiers HTML5, PDF, etc. via DITA-OT.                                          |
 | Visualisation simultanée du rendu HTML5   | Affichage du rendu HTML5 dans une Webview à côté du code XML.                                |
 | Configuration des transtypes              | Permet à l'utilisateur de choisir le format de sortie (HTML5, PDF, etc.).                    |



## Structure du projet



├── .vscode
│   ├── launch.json     // Config for launching and debugging the extension
│   └── tasks.json      // Config for build task that compiles TypeScript
├── .gitignore          // Ignore build output and node_modules
├── README.md           // Readable description of your extension's functionality
├── src
│   ├── extension.ts          # Point d'entrée du plugin
│   ├── ditaValidator.ts      # Validation des fichiers DITA
│   ├── ditaPublisher.ts      # Appel à DITA-OT
│   ├── previewPanel.ts       # Gestion de la Webview
│   └── utils/                # Fonctions utilitaires
├── package.json        // Extension manifest
├── tsconfig.json       // TypeScript configuration

## sites de référence pour la création d'extension vs code 

URL : 

https://code.visualstudio.com/api/get-started/your-first-extension

vs code extenstion anatomy : 

https://code.visualstudio.com/api/get-started/extension-anatomy

https://code.visualstudio.com/api/get-started/wrapping-up

UX guideline : 

https://code.visualstudio.com/api/ux-guidelines/overview




## creation du fichiers JSON extension manifest

example de fichier JSON extantion manifest : 

{
  "name": "helloworld-sample",
  "displayName": "helloworld-sample",
  "description": "HelloWorld example for VS Code",
  "version": "0.0.1",
  "publisher": "vscode-samples",
  "repository": "https://github.com/microsoft/vscode-extension-samples/helloworld-sample",
  "engines": {
    "vscode": "^1.51.0"
  },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "helloworld.helloWorld",
        "title": "Hello World"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^8.10.25",
    "@types/vscode": "^1.51.0",
    "tslint": "^5.16.0",
    "typescript": "^3.4.5"
  }
}


## Étapes Principales

1. Initialisation du projet avec Yeoman Generator pour VS Code, creation de la structure , du fichier JSON Extension Manifest
2. Création de l'éditeur DITA et intégration des outils de validation.
3. Ajout de la fonctionnalité de publication via DITA OT, avoir un bouton pour lancer DITA OT sur un fichier .bookmap.
4. Création d'un WebView pour afficher le rendu HTML5 généré par DITA OT.
5. Test et débogage avec Mocha/Jest.
6. Publication sur le VS Code Marketplace.

## Cas d'utilisation

- **Édition des fichiers DITA** : Validation de la syntaxe et suggestions en temps réel.
- **Publication des fichiers** : Transformation en HTML5 avec DITA OT.
- **Affichage du rendu HTML5** dans une fenêtre séparée.





## Test du Plugin

- Tests unitaires avec Mocha ou Jest.
- Tests d'intégration avec DITA OT.
- Vérification de l'affichage HTML5 dans WebView.

## Publication dans le VS Code Marketplace

1. Créer un compte sur [Visual Studio Marketplace](https://marketplace.visualstudio.com/).
2. Publier avec l'outil `vsce`.

