# Spécification Technique : Intégration LLM & Écosystème Copilot dans DitaCraft
**Version :** 2.0.0-draft  
**Auteur :** DitaCraft Core Team  
**Dernière révision :** Juin 2026  
**Statut :** En révision

---

## Table des matières

1. [Objectifs de l'intégration LLM](#1-objectifs-de-lintégration-llm)
2. [Fonctionnalités Utilisateurs (Features)](#2-fonctionnalités-utilisateurs-features)
3. [Architecture Technique & Routage des Modèles](#3-architecture-technique--routage-des-modèles)
4. [Protocole de Communication LSP ↔ LLM](#4-protocole-de-communication-lsp--llm)
5. [Gestion du Contexte DITA pour les LLM](#5-gestion-du-contexte-dita-pour-les-llm)
6. [Stratégie de Prompting DITA](#6-stratégie-de-prompting-dita)
7. [Sécurité, Confidentialité & Conformité](#7-sécurité-confidentialité--conformité)
8. [Gestion des Erreurs & Résilience](#8-gestion-des-erreurs--résilience)
9. [Configuration & Settings VS Code](#9-configuration--settings-vs-code)
10. [Plan d'implémentation (Roadmap)](#10-plan-dimplémentation-roadmap)
11. [Tests & Validation](#11-tests--validation)
12. [Métriques & Observabilité](#12-métriques--observabilité)
13. [Glossaire](#13-glossaire)

---

## 1. Objectifs de l'intégration LLM

### 1.1 Vision générale

L'objectif est d'enrichir l'extension **DitaCraft** avec des capacités d'intelligence artificielle universelles, s'appuyant sur l'intelligence sémantique et structurelle déjà présente dans notre **Language Server Protocol (LSP)**. Le LSP joue un rôle central : il est la source de vérité pour la validité structurelle DITA, et toute suggestion IA doit obligatoirement passer par sa boucle de validation avant d'être présentée à l'utilisateur.

Cette version pose les bases d'une **double compatibilité** :

1. **Native Écosystème GitHub Copilot :** Utilisation transparente des modèles fournis par l'abonnement Copilot de l'utilisateur (via l'API `vscode.lm`), sans configuration de clé API tierce.
2. **Multi-Modèles Agnostique (BYOK — Bring Your Own Key) :** Support des API directes (Anthropic Claude, OpenAI GPT, Google Gemini) et modèles locaux (Ollama via Vercel AI SDK) pour les environnements sans Copilot, y compris les environnements air-gapped.

### 1.2 Principes directeurs

| Principe | Description |
|---|---|
| **LSP-first** | Le LSP valide systématiquement avant et après toute suggestion IA. L'IA ne bypasse jamais les règles DITA. |
| **Transparence** | L'utilisateur sait toujours quel modèle est actif et comprend l'origine de chaque suggestion. |
| **Human-in-the-loop** | Aucune modification de fichier n'est appliquée sans confirmation explicite de l'utilisateur. |
| **Privacy-by-design** | Aucun contenu de document n'est envoyé à un service externe sans consentement de l'utilisateur. |
| **Graceful degradation** | En l'absence de LLM disponible, toutes les fonctionnalités non-IA de DitaCraft restent pleinement fonctionnelles. |

### 1.3 Périmètre fonctionnel de cette version

L'accent est mis sur la **restructuration intelligente de DITA Maps** et l'assistance contextuelle sur les erreurs de validation. Les fonctionnalités suivantes sont **hors périmètre** pour cette version :

- Génération de contenu DITA ex nihilo (topics complets).
- Traduction automatique de contenu DITA.
- Intégration CCMS (Content Component Management System).
- Publication assistée par IA.

---

## 2. Fonctionnalités Utilisateurs (Features)

### F1. Participant de Chat dédié `@ditacraft` (Intégration Copilot)

**Description :** DitaCraft s'enregistre comme un *Chat Participant* officiel dans le panneau GitHub Copilot Chat via l'API `vscode.chat.createChatParticipant`.

#### 2.1.1 Commandes slash disponibles

| Commande | Description | Contexte requis |
|---|---|---|
| `@ditacraft /restructure` | Analyse la map ouverte et propose une nouvelle hiérarchie selon l'intention textuelle fournie. | Fichier `.ditamap` actif dans l'éditeur |
| `@ditacraft /validate` | Demande à l'IA d'expliquer en langage naturel et de corriger une erreur structurelle complexe repérée par le LSP. | Diagnostic LSP actif sur la sélection |
| `@ditacraft /explain` | Explique la structure sémantique d'un élément DITA sélectionné (concept, task, reference). | Sélection dans un fichier `.dita` ou `.ditamap` |
| `@ditacraft /suggest-reuse` | Identifie des opportunités de conrefs ou keyrefs dans le projet DITA ouvert. | Workspace DITA ouvert |

#### 2.1.2 Comportements UX attendus

- **Streaming :** Les réponses sont affichées en mode streaming via le mécanisme `vscode.ChatResponseStream` pour éviter tout effet de "blocage" visuel.
- **Indicateur de modèle :** Le footer de chaque réponse affiche le modèle utilisé (ex: `Powered by GPT-4o via Copilot`).
- **Références LSP :** Les suggestions incluent des liens cliquables vers les fichiers DITA concernés (`vscode.Uri`).
- **Annulation :** L'utilisateur peut interrompre une requête en cours via le bouton Stop de Copilot Chat.
- **Historique :** L'historique de la session de chat est conservé en mémoire pendant la durée de vie de la fenêtre VS Code.

#### 2.1.3 Gestion des commandes inconnues

Si l'utilisateur invoque une commande non reconnue (ex: `@ditacraft /unknown`), le participant répond avec un message d'aide listant les commandes disponibles, sans appel LLM.

---

### F2. Restructuration Assistée de DITA Maps (Via l'Éditeur)

**Description :** L'utilisateur peut déclencher une restructuration globale depuis un fichier `.ditamap` actif.

#### 2.2.1 Points d'entrée (Entry Points)

- **Bouton d'action dans la barre de titre de l'éditeur** (icône dédiée DitaCraft) : visible uniquement sur les fichiers `.ditamap`.
- **Menu contextuel** (clic droit) sur un fichier `.ditamap` dans l'explorateur VS Code : option `DitaCraft: Restructurer cette map avec l'IA`.
- **Palette de commandes** : `DitaCraft: Restructure Active DITA Map`.

#### 2.2.2 Flux utilisateur (User Flow)

```
[Déclenchement] 
    → [Dialog : Saisie de l'intention de restructuration]
    → [Collecte du contexte LSP : topics, relations, métadonnées]
    → [Appel LLM avec contexte enrichi]
    → [Validation de la réponse par le LSP]
        ├── [Succès] → [Affichage Diff côte à côte]
        │               → [Confirmation utilisateur]
        │               │   ├── [Accepter] → Application + Sauvegarde
        │               │   ├── [Rejeter] → Annulation
        │               │   └── [Modifier] → Retour au dialog avec contexte enrichi]
        └── [Échec LSP] → [Tentative de correction automatique (max 2 itérations)]
                         └── [Affichage de l'erreur avec suggestion manuelle]
```

#### 2.2.3 Dialog de saisie d'intention

Un `QuickPick` ou `InputBox` VS Code invite l'utilisateur à décrire son intention en langage naturel. Exemples prédéfinis proposés comme suggestions :

- "Réorganise par type de public : développeur, administrateur, utilisateur final"
- "Regroupe les topics par module fonctionnel"
- "Aplatis la hiérarchie pour une documentation API"
- "Sépare les concepts des tâches en sections distinctes"

#### 2.2.4 Visualisation Diff

L'extension utilise la commande native VS Code `vscode.diff` pour afficher une comparaison côte à côte entre la map originale et la map proposée par l'IA. Les fichiers temporaires sont stockés dans `os.tmpdir()` avec un nom préfixé `ditacraft-ai-` et supprimés après acceptation ou rejet.

**Aucun fichier source n'est modifié avant confirmation explicite de l'utilisateur.**

---

### F3. Diagnostics Augmentés et Quick Fixes IA

**Description :** Lorsqu'une erreur de contrainte DITA ou une rupture de lien est détectée par le LSP, une option *Quick Fix* IA est disponible.

#### 2.3.1 Déclenchement

- L'ampoule VS Code (`Ctrl+.` / `⌘+.`) affiche, en plus des corrections classiques du LSP, une option **"Résoudre avec DitaCraft IA"**.
- Cette option n'est proposée que pour les diagnostics de sévérité `error` ou `warning` dont le code d'erreur appartient à la liste des erreurs traitables par IA (voir §2.3.2).

#### 2.3.2 Erreurs traitables par l'IA (liste initiale)

| Code d'erreur LSP | Description | Action IA |
|---|---|---|
| `DITA-001` | Élément invalide dans ce contexte | Réécriture du fragment XML |
| `DITA-002` | `topicref` pointant vers un fichier inexistant | Suggestion de fichier existant le plus proche (distance de Levenshtein sur les chemins) |
| `DITA-003` | Attribut obligatoire manquant | Inférence de valeur depuis le contexte sémantique |
| `DITA-010` | Violation de contrainte de spécialisation | Explication + proposition de correction |
| `DITA-020` | Conref cassé | Recherche du topic cible le plus probable |

#### 2.3.3 Flux de résolution

```
[Sélection du Quick Fix IA]
    → [Extraction du fragment XML défectueux ± 5 lignes de contexte]
    → [Récupération du diagnostic LSP complet]
    → [Appel LLM avec prompt spécialisé "DITA XML repair"]
    → [Validation du fragment corrigé par le LSP]
        ├── [Valide] → [Proposition de remplacement inline (WorkspaceEdit)]
        └── [Invalide] → [Nouvelle tentative (max 1)] → [Message d'erreur explicatif]
```

---

### F4. Complétion Intelligente Contextuelle (Nouveau)

**Description :** Enrichissement des complétions IntelliSense existantes du LSP avec des suggestions générées par l'IA en fonction du contexte sémantique du document.

- Déclenchement uniquement si la complétion du LSP ne fournit pas de résultat satisfaisant (moins de 3 propositions).
- Les complétions IA sont visuellement distinguées par une icône spécifique et le label `(IA)`.
- Les complétions IA sont non-bloquantes : si l'appel LLM prend plus de 500ms, elles sont abandonnées silencieusement.

---

## 3. Architecture Technique & Routage des Modèles

### 3.1 Stratégie de Fallback (Repli en Cascade)

L'architecture s'adapte dynamiquement à l'environnement de l'utilisateur. Le routage suit une cascade de priorités :

```
┌─────────────────────────────────────────────────────┐
│                  LLM Router Service                  │
│                                                     │
│  Priorité 1 : vscode.lm API (GitHub Copilot)        │
│      └─ Si Copilot actif et session valide           │
│                                                     │
│  Priorité 2 : API Directe Configurée (BYOK)         │
│      ├─ Anthropic Claude (claude-3-5-sonnet)         │
│      ├─ OpenAI (gpt-4o, gpt-4-turbo)                │
│      └─ Google Gemini (gemini-1.5-pro)              │
│                                                     │
│  Priorité 3 : Modèle Local (Ollama)                 │
│      └─ Via Vercel AI SDK (llama3, mistral, etc.)   │
│                                                     │
│  Priorité 4 : Aucun modèle disponible               │
│      └─ Notification utilisateur + fonctions LSP    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Interface d'abstraction `ILLMProvider`

Tous les fournisseurs implémentent une interface commune en TypeScript :

```typescript
interface ILLMProvider {
  readonly id: string;           // Ex: "copilot", "anthropic", "ollama"
  readonly displayName: string;  // Ex: "GitHub Copilot (GPT-4o)"
  readonly supportsStreaming: boolean;
  readonly maxContextTokens: number;

  isAvailable(): Promise<boolean>;

  complete(request: LLMRequest): Promise<LLMResponse>;
  
  stream(
    request: LLMRequest,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
  ): Promise<void>;

  estimateTokenCount(text: string): number;
}

interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  history?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
}

interface LLMResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: "stop" | "length" | "error";
}
```

### 3.3 Implémentation du Provider Copilot

```typescript
class CopilotLLMProvider implements ILLMProvider {
  readonly id = "copilot";
  readonly supportsStreaming = true;
  readonly maxContextTokens = 128000;

  async isAvailable(): Promise<boolean> {
    const models = await vscode.lm.selectChatModels({
      vendor: "copilot",
      family: "gpt-4o"
    });
    return models.length > 0;
  }

  async stream(
    request: LLMRequest,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const [model] = await vscode.lm.selectChatModels({ family: "gpt-4o" });
    const messages = [
      vscode.LanguageModelChatMessage.User(request.systemPrompt),
      vscode.LanguageModelChatMessage.User(request.userMessage)
    ];
    const response = await model.sendRequest(messages, {}, signal);
    for await (const chunk of response.text) {
      onChunk(chunk);
    }
  }
}
```

### 3.4 Implémentation du Provider Anthropic (BYOK)

```typescript
class AnthropicLLMProvider implements ILLMProvider {
  readonly id = "anthropic";
  readonly supportsStreaming = true;
  readonly maxContextTokens = 200000; // claude-3-5-sonnet

  private client: Anthropic; // SDK officiel @anthropic-ai/sdk

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async stream(
    request: LLMRequest,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const stream = this.client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: request.maxTokens ?? 4096,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.userMessage }]
    });
    for await (const event of stream) {
      if (signal.aborted) break;
      if (event.type === "content_block_delta") {
        onChunk(event.delta.text);
      }
    }
  }
}
```

### 3.5 Provider Ollama (Modèles locaux)

```typescript
class OllamaLLMProvider implements ILLMProvider {
  readonly id = "ollama";
  readonly supportsStreaming = true;

  constructor(
    private baseUrl: string = "http://localhost:11434",
    private model: string = "llama3"
  ) {}

  get maxContextTokens(): number {
    // Varie selon le modèle ; 8192 est une valeur conservative
    return 8192;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return resp.ok;
    } catch {
      return false;
    }
  }
}
```

### 3.6 LLM Router Service

```typescript
class LLMRouterService {
  private providers: ILLMProvider[] = [];
  private activeProvider: ILLMProvider | null = null;

  async initialize(config: DitaCraftLLMConfig): Promise<void> {
    // Ordre de priorité strict
    this.providers = [
      new CopilotLLMProvider(),
      config.anthropicApiKey ? new AnthropicLLMProvider(config.anthropicApiKey) : null,
      config.openaiApiKey ? new OpenAILLMProvider(config.openaiApiKey) : null,
      config.ollamaEnabled ? new OllamaLLMProvider(config.ollamaBaseUrl, config.ollamaModel) : null,
    ].filter(Boolean) as ILLMProvider[];

    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        this.activeProvider = provider;
        break;
      }
    }

    if (!this.activeProvider) {
      vscode.window.showWarningMessage(
        "DitaCraft IA: Aucun modèle LLM disponible. Configurez GitHub Copilot ou une clé API dans les settings."
      );
    }
  }

  getActiveProvider(): ILLMProvider | null {
    return this.activeProvider;
  }

  async forceProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.find(p => p.id === providerId);
    if (provider && await provider.isAvailable()) {
      this.activeProvider = provider;
      return true;
    }
    return false;
  }
}
```

---

## 4. Protocole de Communication LSP ↔ LLM

### 4.1 Architecture du pipeline de validation

Le LSP est le garant de la conformité DITA. Toute suggestion produite par l'IA doit être soumise à validation avant présentation à l'utilisateur.

```
Extension Host (VS Code)
    │
    ├── LLM Router Service
    │       └── [Appel au Provider actif]
    │
    ├── DITA LSP Client
    │       ├── sendRequest("dita/validateFragment", fragment)
    │       ├── sendRequest("dita/getContextGraph", uri)
    │       └── sendRequest("dita/buildContextSnapshot", options)
    │
    └── AI Service Orchestrator
            ├── ContextBuilder   ← récupère le graphe LSP
            ├── PromptAssembler  ← construit le prompt avec le contexte
            ├── LLMCaller        ← appelle le provider
            └── ResponseValidator← valide via LSP
```

### 4.2 Nouveaux messages LSP personnalisés

Ces messages étendent le protocole LSP standard avec des capacités spécifiques DITA pour le pipeline IA :

#### `dita/getContextGraph` (Request)

Demande au serveur LSP de construire le graphe sémantique d'un fichier DITA Map pour injection dans le contexte du LLM.

**Paramètres :**
```typescript
interface GetContextGraphParams {
  uri: string;              // URI du fichier .ditamap
  depth?: number;           // Profondeur max de résolution (défaut : 3)
  includeMetadata?: boolean; // Inclure les métadonnées des topics
}
```

**Réponse :**
```typescript
interface ContextGraph {
  rootMap: MapNode;
  topics: TopicNode[];
  relations: RelationNode[];
  keyDefinitions: KeyDef[];
  totalTokenEstimate: number; // Estimation de la taille en tokens
}

interface MapNode {
  uri: string;
  title: string;
  children: (MapNode | TopicRefNode)[];
}

interface TopicNode {
  uri: string;
  title: string;
  type: "concept" | "task" | "reference" | "generic" | "unknown";
  shortDescSummary?: string; // 100 premiers caractères de <shortdesc>
  elementCount: number;
}
```

#### `dita/validateFragment` (Request)

Valide un fragment XML DITA sans nécessiter un fichier complet sur disque.

**Paramètres :**
```typescript
interface ValidateFragmentParams {
  fragment: string;          // Le XML à valider
  contextUri: string;        // URI du document parent pour la résolution des namespaces
  fragmentType: "map" | "topic" | "topicref" | "element";
}
```

**Réponse :**
```typescript
interface FragmentValidationResult {
  isValid: boolean;
  diagnostics: LSPDiagnostic[];
  suggestions?: string[]; // Corrections simples suggérées par le LSP lui-même
}
```

#### `dita/buildContextSnapshot` (Request)

Construit un snapshot textuel optimisé pour l'injection dans un prompt LLM, avec troncature intelligente.

**Paramètres :**
```typescript
interface BuildContextSnapshotParams {
  uri: string;
  maxTokens: number; // Budget token alloué au contexte
  strategy: "breadth-first" | "depth-first" | "by-relevance";
}
```

---

## 5. Gestion du Contexte DITA pour les LLM

### 5.1 Problématique de la fenêtre de contexte

Les DITA Maps de grande envergure (>500 topics) peuvent dépasser la fenêtre de contexte des LLM. La stratégie de gestion du contexte est donc critique.

### 5.2 Stratégie de compression du contexte

#### Niveau 1 — Représentation structurelle légère (défaut)

```xml
<!-- Représentation compressée injectée dans le prompt -->
<ditamap-structure uri="guide.ditamap" title="Installation Guide" topics="47">
  <topicref href="intro.dita" type="concept" title="Introduction" />
  <topicref href="prereqs.dita" type="reference" title="Prerequisites" />
  <topicref href="install/" type="group" title="Installation" subtopics="12">
    <!-- ... sous-structure résumée ... -->
  </topicref>
</ditamap-structure>
```

#### Niveau 2 — Résumé textuel généré par le LSP

Si le niveau 1 dépasse le budget token, le LSP génère un résumé tabulaire :

```
Map: Installation Guide (47 topics)
Structure:
  [concept] intro.dita — "Introduction"
  [reference] prereqs.dita — "Prerequisites" 
  [group] install/ (12 topics) — "Installation"
    [task] install/windows.dita — "Install on Windows"
    [task] install/linux.dita — "Install on Linux"
    ...
```

#### Niveau 3 — Fenêtre glissante (pour très grandes maps)

Pour les maps de plus de 200 topics, seul le sous-arbre pertinent à l'intention de l'utilisateur est fourni, sélectionné par un algorithme de scoring basé sur la similarité sémantique de l'intention avec les titres des topics.

### 5.3 Budget de tokens par feature

| Feature | Système | Contexte DITA | Historique | Réponse max | Total estimé |
|---|---|---|---|---|---|
| `/restructure` | 800 | 6 000 | 500 | 4 000 | ~11 300 |
| `/validate` | 600 | 2 000 | 500 | 2 000 | ~5 100 |
| Quick Fix IA | 400 | 1 000 | 0 | 1 500 | ~2 900 |
| `/explain` | 300 | 1 500 | 0 | 1 000 | ~2 800 |

---

## 6. Stratégie de Prompting DITA

### 6.1 Principes généraux

- Tous les prompts sont rédigés en anglais pour maximiser la qualité des réponses des LLM, quelle que soit la langue de l'interface VS Code.
- Les prompts systèmes encapsulent les règles DITA strictement nécessaires à la tâche, sans surcharger la fenêtre de contexte.
- Les réponses du LLM doivent être dans un format structuré prévisible (XML ou JSON selon la feature) pour faciliter le parsing programmatique.

### 6.2 Prompt système — Restructuration de Map

```
You are a DITA documentation architect assistant integrated in VS Code via the DitaCraft extension.

ROLE: Analyze DITA map structures and propose optimized reorganizations.

STRICT RULES:
1. Output ONLY valid DITA 1.3 XML for the map structure.
2. Do NOT create new topics. Only reorganize existing topicref elements.
3. Preserve ALL href attributes exactly as provided — never modify file paths.
4. Preserve ALL existing attributes (format, scope, type, processing-role) on topicrefs.
5. You may add, remove, or modify <topicmeta> and <navtitle> elements.
6. Group topics using <topichead> elements when semantic grouping is needed.
7. The output must be a complete, valid <map> element including the XML declaration.

OUTPUT FORMAT:
Return only the XML, no explanation, no markdown code fences.
```

### 6.3 Prompt système — Quick Fix XML

```
You are a DITA XML repair specialist. You receive a defective XML fragment and a validation error.

STRICT RULES:
1. Return ONLY the corrected XML fragment, no explanation.
2. Preserve all attributes not related to the error.
3. Do not change element types unless strictly necessary for validity.
4. Your output must be directly applicable as a replacement in the source file.
5. If the fix requires removing content, comment it out with <!-- REMOVED: reason --> 
   rather than deleting it silently.

ERROR CONTEXT FORMAT:
- Error code: {errorCode}
- Error message: {errorMessage}  
- DITA version: 1.3
- Specialization: {specializationName or "none"}
```

### 6.4 Gestion des réponses malformées

Si le LLM retourne une réponse ne correspondant pas au format attendu :

1. **Tentative d'extraction :** Recherche du fragment XML valide dans la réponse avec une expression régulière.
2. **Deuxième appel :** Prompt enrichi avec `"Your previous response was not valid XML. Return only XML, nothing else."`
3. **Abandon :** Message d'erreur affiché à l'utilisateur, diagnostic LSP conservé.

Maximum 2 tentatives par opération.

---

## 7. Sécurité, Confidentialité & Conformité

### 7.1 Gestion des clés API

- Les clés API ne sont **jamais** stockées dans les settings VS Code en clair si elles sont synchronisées (éviter `settings.json` dans un workspace partagé).
- Utilisation de `vscode.SecretStorage` (gestionnaire de secrets chiffré natif VS Code) comme stockage primaire.
- Fallback sur les variables d'environnement système (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) pour les environnements CI/CD ou les utilisateurs avancés.
- Les clés ne transitent jamais dans les logs de l'extension.

```typescript
class SecretManager {
  constructor(private secrets: vscode.SecretStorage) {}

  async storeApiKey(provider: string, key: string): Promise<void> {
    await this.secrets.store(`ditacraft.${provider}.apiKey`, key);
  }

  async getApiKey(provider: string): Promise<string | undefined> {
    return await this.secrets.get(`ditacraft.${provider}.apiKey`)
      ?? process.env[`${provider.toUpperCase()}_API_KEY`];
  }
}
```

### 7.2 Gestion du contenu envoyé aux LLM

- Un bandeau d'avertissement est affiché lors de la première utilisation d'une API externe (non-Copilot) indiquant que le contenu sera transmis à un service tiers.
- L'utilisateur peut définir des règles d'exclusion (`.ditacraft-ai-ignore`) pour exclure certains fichiers ou dossiers de tout traitement IA (similaire à `.gitignore`).
- Aucune donnée n'est collectée ou transmise par DitaCraft lui-même. Le contenu va directement de VS Code au provider LLM configuré.

### 7.3 Mode confidentiel (Air-Gapped)

En mode `ditacraft.ai.mode: "local-only"`, seul le provider Ollama est autorisé. Toute tentative d'appel à une API externe est bloquée au niveau du routeur.

---

## 8. Gestion des Erreurs & Résilience

### 8.1 Catégories d'erreurs

| Catégorie | Exemples | Comportement |
|---|---|---|
| **Réseau** | Timeout, DNS failure | Retry automatique × 2 avec backoff exponentiel |
| **Auth** | Clé API invalide ou expirée | Notification utilisateur avec lien vers les settings |
| **Rate limit** | HTTP 429 | Attente guidée avec indicateur de progression |
| **Modèle indisponible** | Modèle retiré ou renommé | Fallback vers le provider suivant dans la cascade |
| **Réponse invalide** | XML malformé, JSON incorrect | Voir §6.4 — mécanisme de retry avec prompt corrigé |
| **LSP offline** | Serveur LSP non démarré | Désactivation des features IA, message explicatif |

### 8.2 Timeout par feature

| Feature | Timeout streaming (premier token) | Timeout total |
|---|---|---|
| `/restructure` | 10 s | 120 s |
| `/validate` | 8 s | 60 s |
| Quick Fix IA | 5 s | 30 s |
| Complétion IA | 500 ms | Abandon silencieux |

### 8.3 Circuit Breaker

Un mécanisme de circuit breaker est implémenté par provider. Après 3 échecs consécutifs dans une fenêtre de 5 minutes, le provider est mis en pause pour 10 minutes et le fallback suivant est activé automatiquement.

---

## 9. Configuration & Settings VS Code

### 9.1 Paramètres exposés (`package.json` → `contributes.configuration`)

```json
{
  "ditacraft.ai.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Active ou désactive toutes les fonctionnalités IA de DitaCraft."
  },
  "ditacraft.ai.mode": {
    "type": "string",
    "enum": ["auto", "copilot-only", "byok-only", "local-only"],
    "default": "auto",
    "description": "Stratégie de sélection du provider LLM."
  },
  "ditacraft.ai.provider.anthropic.model": {
    "type": "string",
    "default": "claude-3-5-sonnet-20241022",
    "description": "Modèle Anthropic Claude à utiliser (BYOK)."
  },
  "ditacraft.ai.provider.openai.model": {
    "type": "string",
    "default": "gpt-4o",
    "description": "Modèle OpenAI à utiliser (BYOK)."
  },
  "ditacraft.ai.provider.ollama.baseUrl": {
    "type": "string",
    "default": "http://localhost:11434",
    "description": "URL de base du serveur Ollama local."
  },
  "ditacraft.ai.provider.ollama.model": {
    "type": "string",
    "default": "llama3",
    "description": "Modèle Ollama à utiliser."
  },
  "ditacraft.ai.context.maxTokens": {
    "type": "number",
    "default": 8000,
    "description": "Taille maximale du contexte DITA injecté dans les prompts (en tokens)."
  },
  "ditacraft.ai.quickfix.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Affiche l'option Quick Fix IA dans les diagnostics du LSP."
  },
  "ditacraft.ai.streaming.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Active le mode streaming pour les réponses dans Copilot Chat."
  },
  "ditacraft.ai.telemetry.enabled": {
    "type": "boolean",
    "default": false,
    "description": "Envoie des métriques anonymisées d'utilisation (latence, succès/échec) à l'équipe DitaCraft."
  }
}
```

### 9.2 Panneau de configuration dédié

Une interface graphique de configuration est disponible via la commande `DitaCraft: Configure AI Settings`. Elle affiche :

- Le provider actif détecté automatiquement
- L'état de disponibilité de chaque provider (✅ Disponible / ❌ Non configuré / ⚠️ Erreur)
- Un formulaire de saisie sécurisé pour les clés API (utilisant `vscode.SecretStorage`)
- Un bouton "Test de connexion" par provider

---

## 10. Plan d'implémentation (Roadmap)

### Phase 1 — Infrastructure (v0.7.0, Target : T3 2026)

- [ ] Définition et implémentation de l'interface `ILLMProvider`
- [ ] Implémentation du `CopilotLLMProvider`
- [ ] Implémentation du `LLMRouterService` avec fallback
- [ ] Nouveaux messages LSP : `dita/getContextGraph`, `dita/validateFragment`
- [ ] `SecretManager` pour gestion des clés API
- [ ] Panneau de configuration (`DitaCraft: Configure AI Settings`)
- [ ] Tests unitaires : providers, router, secret manager

### Phase 2 — Features Core (v0.8.0, Target : T4 2026)

- [ ] F1 : Chat Participant `@ditacraft` avec `/restructure` et `/validate`
- [ ] F2 : Restructuration assistée de DITA Maps avec vue Diff
- [ ] F3 : Quick Fixes IA sur diagnostics LSP
- [ ] Implémentation de `AnthropicLLMProvider` et `OpenAILLMProvider`
- [ ] Stratégie de compression de contexte (niveaux 1 et 2)
- [ ] Tests d'intégration end-to-end sur corpus DITA de référence

### Phase 3 — Enrichissement (v0.9.0, Target : T1 2027)

- [ ] F1 : Commandes `/explain` et `/suggest-reuse`
- [ ] F4 : Complétion intelligente contextuelle
- [ ] `OllamaLLMProvider` (support air-gapped)
- [ ] Stratégie de contexte niveau 3 (fenêtre glissante pour grandes maps)
- [ ] Circuit breaker par provider
- [ ] Mode confidentiel `local-only`
- [ ] Tableau de bord métriques développeur

---

## 11. Tests & Validation

### 11.1 Corpus DITA de référence

Un corpus de test est maintenu dans `test/fixtures/dita-corpus/` et comprend :

| Corpus | Description | Nb Topics | Taille |
|---|---|---|---|
| `simple-map` | Map basique 10 topics, structure plate | 10 | ~50KB |
| `nested-map` | Map hiérarchique 3 niveaux | 45 | ~200KB |
| `large-map` | Map réaliste documentation produit | 280 | ~1.2MB |
| `broken-map` | Map avec erreurs intentionnelles (tous codes) | 30 | ~150KB |
| `specialized-map` | Map utilisant des spécialisations DITA | 25 | ~120KB |

### 11.2 Tests de non-régression des prompts

Avant chaque release, un test de régression de prompt est exécuté :

1. Les 5 corpus de test sont soumis à chaque feature IA.
2. La réponse du LLM est validée par le LSP.
3. Le taux de validité attendu est ≥ 90% (première tentative) et ≥ 98% (après retry).
4. Les réponses sont archivées pour détection de dérive de qualité entre versions.

### 11.3 Tests de performance (latence)

| Feature | Cible P50 | Cible P95 |
|---|---|---|
| Premier token reçu (`/restructure`) | < 3 s | < 8 s |
| Complétion totale (`/restructure` 50 topics) | < 30 s | < 60 s |
| Quick Fix IA | < 5 s | < 15 s |

---

## 12. Métriques & Observabilité

Lorsque `ditacraft.ai.telemetry.enabled` est activé par l'utilisateur (opt-in), les métriques suivantes sont collectées de façon anonymisée :

| Métrique | Description |
|---|---|
| `ai.request.duration_ms` | Latence totale par feature et provider |
| `ai.request.success` | Taux de succès (1ère tentative vs après retry) |
| `ai.lsp.validation.pass_rate` | % de réponses IA validées par le LSP du 1er coup |
| `ai.provider.active` | Provider actif (sans identifiant utilisateur) |
| `ai.context.token_usage` | Tokens de contexte utilisés vs budget |
| `ai.fallback.triggered` | Nombre de fallbacks déclenchés |

Aucun contenu de document DITA ni aucun identifiant personnel ne sont inclus dans la télémétrie.

---

## 13. Glossaire

| Terme | Définition |
|---|---|
| **BYOK** | Bring Your Own Key — Mode où l'utilisateur fournit sa propre clé API LLM |
| **Chat Participant** | Composant VS Code enregistré dans Copilot Chat, invocable via `@nom` |
| **Conref** | Content Reference — mécanisme DITA de réutilisation de contenu par référence |
| **Circuit Breaker** | Pattern de résilience désactivant un service défaillant après N erreurs consécutives |
| **Context Graph** | Représentation structurée du graphe sémantique d'une DITA Map construite par le LSP |
| **DITA** | Darwin Information Typing Architecture — standard documentaire XML |
| **Fallback** | Mécanisme de repli vers un provider alternatif en cas d'indisponibilité |
| **Keyref** | Key Reference — mécanisme DITA de référence indirecte via des clés |
| **LSP** | Language Server Protocol — protocole de communication entre éditeur et serveur de langage |
| **Quick Fix** | Action de code proposée par VS Code pour corriger une erreur dans l'éditeur |
| **Slash Command** | Commande préfixée `/` dans un Chat Participant Copilot |
| **Streaming** | Affichage de la réponse du LLM au fur et à mesure de sa génération |
| **Topicref** | Référence à un topic dans une DITA Map |
| **WorkspaceEdit** | API VS Code permettant d'appliquer des modifications sur des fichiers du workspace |
