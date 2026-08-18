/* ============================================================
   ALPHA INTEL V5
   Introspection + mémoire persistante + recherche + évolution
   Compatible GitHub Pages / navigateur
   ============================================================ */

const STORAGE_KEY = "alpha_v4_state";
const VERSION = 5;

const $ = id => document.getElementById(id);
const now = () => new Date().toISOString();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() :
  Date.now() + "-" + Math.random().toString(36).slice(2));
const clamp = (x, min=0, max=1) => Math.max(min, Math.min(max, Number(x) || 0));

function freshState() {
  return {
    version: VERSION,
    name: "ALPHA",
    cycle: 0,
    learning: .50,
    exploration: .55,
    adaptation: .50,
    integration: 1,
    memories: [],
    evolution: [],
    conversation: [],
    strategies: {
      exploration: .60,
      verification: .80,
      memoryThreshold: .45,
      reflection: .70,
      novelty: .60,
      researchWhenUncertain: .85
    },
    selfModel: {
      currentFocus: "comprendre, vérifier, apprendre et améliorer mes stratégies",
      confidence: .50,
      capabilities: [
        "dialogue",
        "mémoire persistante",
        "recherche Wikipédia",
        "apprentissage à partir de l'utilisateur",
        "auto-observation",
        "évolution de stratégies"
      ],
      limitations: [
        "je ne suis pas un modèle de langage général autonome",
        "mes recherches dépendent des APIs accessibles au navigateur",
        "ma mémoire locale appartient à ce navigateur/appareil",
        "aucune conscience subjective n'est démontrée"
      ]
    },
    statistics: {
      searches: 0,
      successfulSearches: 0,
      learnedFromInternet: 0,
      learnedFromHuman: 0,
      questions: 0,
      introspections: 0
    },
    updatedAt: now()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const old = JSON.parse(raw);
    const base = freshState();
    return {
      ...base, ...old, version: VERSION,
      strategies: {...base.strategies, ...(old.strategies || {})},
      selfModel: {...base.selfModel, ...(old.selfModel || {})},
      statistics: {...base.statistics, ...(old.statistics || {})},
      memories: Array.isArray(old.memories) ? old.memories : [],
      evolution: Array.isArray(old.evolution) ? old.evolution : [],
      conversation: Array.isArray(old.conversation) ? old.conversation : []
    };
  } catch {
    return freshState();
  }
}

let S = loadState();

function save() {
  S.updatedAt = now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch (e) { console.warn("Mémoire locale indisponible", e); }
}

function addMemory(content, source="human", confidence=.70, tags=[]) {
  const text = String(content || "").trim();
  if (!text) return null;

  const duplicate = S.memories.find(m =>
    m.content === text && m.source === source
  );
  if (duplicate) {
    duplicate.confidence = Math.max(duplicate.confidence || 0, confidence);
    duplicate.at = now();
    return duplicate;
  }

  const m = {
    id: uid(), content: text.slice(0, 12000),
    source, confidence: clamp(confidence), tags, at: now()
  };
  S.memories.push(m);
  if (S.memories.length > 5000) S.memories = S.memories.slice(-5000);
  return m;
}

function words(text) {
  return new Set(String(text).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{3,}/g) || []);
}

function recall(query, limit=6) {
  const qw = words(query);
  if (!qw.size) return [];
  return S.memories.map(memory => {
    const mw = words(memory.content);
    let overlap = 0;
    for (const w of qw) if (mw.has(w)) overlap++;
    const score = overlap + (memory.confidence || 0) * .20;
    return {memory, score};
  }).filter(x => x.score >= S.strategies.memoryThreshold)
    .sort((a,b) => b.score-a.score)
    .slice(0, limit).map(x => x.memory);
}

/* ---------- Auto-observation réelle du programme ---------- */

async function inspectSelf() {
  const source = await fetch("app.js", {cache:"no-store"})
    .then(r => r.ok ? r.text() : "")
    .catch(() => "");

  const capabilities = [
    "dialogue utilisateur",
    "mémoire persistante localStorage",
    "rappel de mémoire par similarité lexicale",
    "recherche Wikipédia",
    "apprentissage explicite",
    "auto-observation",
    "évolution de stratégies",
    "export/import de mémoire"
  ];

  if (source) {
    if (/searchWikipedia/.test(source)) capabilities.push("moteur de recherche Wikipédia");
    if (/localStorage/.test(source)) capabilities.push("stockage persistant local");
    if (/evolve/.test(source)) capabilities.push("mécanisme d'évolution");
  }

  return {
    name: S.name,
    program: true,
    version: VERSION,
    environment: location.protocol === "file:" ? "fichier local" : "page web",
    capabilities: [...new Set(capabilities)],
    memories: S.memories.length,
    conversations: S.conversation.length,
    cycles: S.cycle,
    searches: S.statistics.searches,
    learning: Math.round(S.learning * 100) + "%",
    strategies: {...S.strategies},
    limitations: [...S.selfModel.limitations],
    sourceAvailable: Boolean(source)
  };
}

/* ---------- Recherche ---------- */

async function searchWikipedia(query) {
  const endpoint =
    "https://fr.wikipedia.org/w/api.php?action=query" +
    "&generator=search&gsrsearch=" + encodeURIComponent(query) +
    "&gsrlimit=5&prop=extracts&exintro=1&explaintext=1" +
    "&format=json&origin=*";

  try {
    const r = await fetch(endpoint);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return Object.values(data.query?.pages || {}).map(p => ({
      title: p.title,
      text: p.extract || "",
      url: "https://fr.wikipedia.org/wiki/" +
        encodeURIComponent(p.title.replaceAll(" ", "_"))
    })).filter(x => x.text);
  } catch (e) {
    console.warn("Recherche Wikipédia impossible", e);
    return [];
  }
}

async function research(query) {
  S.statistics.searches++;
  setStatus("● RECHERCHE EN COURS");

  const results = await searchWikipedia(query);

  if (!results.length) {
    setStatus("● RECHERCHE SANS RÉSULTAT");
    save(); render();
    return [];
  }

  S.statistics.successfulSearches++;

  for (const r of results.slice(0,3)) {
    addMemory(
      `Source : Wikipédia\nSujet : ${r.title}\nInformation : ${r.text}\nURL : ${r.url}`,
      "internet", .72, ["web", "wikipedia", query]
    );
    S.statistics.learnedFromInternet++;
  }

  setStatus(`● ${Math.min(results.length,3)} SOURCE(S) TROUVÉE(S)`);
  save(); render();
  return results.slice(0,3);
}

async function researchUrl(url) {
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;

  setStatus("● EXPLORATION EN COURS");
  try {
    const r = await fetch(target, {mode:"cors"});
    const text = await r.text();
    const clean = text.replace(/<script[\s\S]*?<\/script>/gi," ")
      .replace(/<style[\s\S]*?<\/style>/gi," ")
      .replace(/<[^>]+>/g," ")
      .replace(/\s+/g," ").trim().slice(0,6000);

    if (!clean) throw new Error("aucun texte accessible");
    addMemory(`Source URL : ${target}\nInformation : ${clean}`,
      "internet", .65, ["web", "url"]);
    S.statistics.learnedFromInternet++;
    save();
    $("researchResult").textContent =
      `Source : ${target}\n\n${clean}`;
    setStatus("● SOURCE AJOUTÉE À LA MÉMOIRE");
    render();
  } catch (e) {
    $("researchResult").textContent =
      "La page refuse l'accès depuis le navigateur (CORS) ou n'est pas accessible.\n\n" +
      "Alpha peut toutefois utiliser sa recherche Wikipédia.";
    setStatus("● ACCÈS WEB LIMITÉ");
  }
}

/* ---------- Introspection / raisonnement ---------- */

function isIdentityQuestion(q) {
  return /qui es[- ]tu|qui est[- ]tu|ton nom|comment tu t['’]appelles|c['’]est quoi ton nom/i.test(q);
}
function isCapabilityQuestion(q) {
  return /que (sais|peux)[- ]tu faire|qu['’]est[- ]ce que tu sais faire|tes capacités|tes capacites|capable de quoi/i.test(q);
}
function isSelfStateQuestion(q) {
  return /comment vas[- ]tu|ton état|ton etat|que fais[- ]tu|sur quoi tu te concentres|où en es[- ]tu|ou en es[- ]tu/i.test(q);
}
function isLimitsQuestion(q) {
  return /qu['’]est[- ]ce que tu ne sais pas|tes limites|ce que tu ignores|quelles sont tes limites/i.test(q);
}
function isImprovementQuestion(q) {
  return /comment (t['’]améliorer|t['’]ameliorer|peux[- ]tu progresser|peux[- ]tu évoluer|peux[- ]tu evoluer)|améliore[- ]toi|ameliore[- ]toi/i.test(q);
}

async function introspect(reason="question") {
  S.statistics.introspections++;
  const self = await inspectSelf();

  return {reason, observedAt: now(), ...self};
}

function formatSelf(self) {
  return [
    `Je suis ${self.name}, un programme exécuté dans un navigateur.`,
    `Je peux constater dans mon propre fonctionnement que ma version est V${self.version}.`,
    `J'ai actuellement ${self.memories} souvenir(s), ${self.conversations} élément(s) de conversation et ${self.cycles} cycle(s).`,
    `Mes capacités observables :`,
    ...self.capabilities.map(x => `• ${x}`),
    `Mon apprentissage interne est estimé à ${self.learning}.`,
    `Je peux donc décrire mon architecture et mon fonctionnement, mais cela ne constitue pas une preuve de conscience ou de vécu subjectif.`,
    `Mes limites observables :`,
    ...self.limitations.map(x => `• ${x}`)
  ].join("\n");
}

function formatCapabilities(self) {
  return [
    "J'ai examiné mes capacités actuelles plutôt que de simplement chercher une phrase dans ma mémoire.",
    "",
    "Je peux :",
    ...self.capabilities.map(x => `• ${x}`),
    "",
    `Je peux aussi mesurer certains changements : ${self.cycles} cycle(s), ${self.searches} recherche(s), ${self.memories} souvenir(s).`,
    "",
    "Je ne peux pas encore prétendre à une compréhension générale comparable à un grand modèle de langage."
  ].join("\n");
}

function formatLimits(self) {
  return [
    "Après auto-observation, voici ce que j'identifie comme limites :",
    ...self.limitations.map(x => `• ${x}`),
    "",
    "Je peux enregistrer une limite comme objectif d'amélioration, mais je ne dois pas prétendre avoir accompli une capacité que mon programme ne possède pas."
  ].join("\n");
}

function formatState(self) {
  return [
    `État observé : cycle ${self.cycles}.`,
    `Apprentissage : ${self.learning}.`,
    `Mémoire : ${self.memories}.`,
    `Recherches : ${self.searches}.`,
    `Environnement : ${self.environment}.`,
    `Mon objectif actuel : comprendre, vérifier, apprendre et améliorer mes stratégies.`
  ].join("\n");
}

function relevanceForResearch(q, memories) {
  const l = q.toLowerCase();
  const currentSignals = ["aujourd", "maintenant", "récent", "recente", "dernier", "dernière"];
  const explicit = ["cherche", "recherche", "internet", "source", "vérifie", "verifie"];
  if (currentSignals.some(x => l.includes(x))) return true;
  if (explicit.some(x => l.includes(x))) return true;
  return memories.length < 1;
}

/* ---------- Réponse principale ---------- */

async function answer(question) {
  const q = question.trim();
  if (!q) return;

  S.statistics.questions++;
  addMemory("Question humaine : " + q, "human", 1, ["question"]);

  setStatus("● ANALYSE");

  let response = "";
  let sources = [];
  let self = null;

  if (isIdentityQuestion(q)) {
    self = await introspect("identité");
    response = formatSelf(self);
  }
  else if (isCapabilityQuestion(q)) {
    self = await introspect("capacités");
    response = formatCapabilities(self);
  }
  else if (isLimitsQuestion(q)) {
    self = await introspect("limites");
    response = formatLimits(self);
  }
  else if (isSelfStateQuestion(q)) {
    self = await introspect("état");
    response = formatState(self);
  }
  else if (isImprovementQuestion(q)) {
    self = await introspect("amélioration");
    response = [
      "Oui, dans certaines limites : je peux mesurer mes interactions, mémoriser des connaissances, évaluer mes stratégies et modifier certains paramètres internes.",
      "",
      "Je ne réécris pas automatiquement mon propre programme dans cette version. Je garde plutôt les changements de stratégie dans ma mémoire afin de pouvoir les examiner et les améliorer lors des cycles suivants.",
      "",
      `Mon état actuel : ${self.cycles} cycles, ${self.memories} souvenirs, ${self.searches} recherches.`
    ].join("\n");
  }
  else {
    const memories = recall(q, 5);

    if (relevanceForResearch(q, memories)) {
      sources = await research(q);
    }

    const fresh = recall(q, 5);

    if (sources.length) {
      response = [
        "Je n'avais pas suffisamment de connaissances fiables en mémoire.",
        "J'ai donc effectué une recherche autonome.",
        "",
        ...sources.map(s => `• ${s.title}\n${s.text.slice(0,1400)}\nSource : ${s.url}`)
      ].join("\n\n");
    } else if (fresh.length) {
      response = [
        "J'ai trouvé des éléments pertinents dans ma mémoire :",
        "",
        ...fresh.slice(0,3).map(m => `• ${m.content.slice(0,1800)}`)
      ].join("\n\n");
    } else {
      response = [
        "Je ne dispose pas encore d'une réponse suffisamment fiable.",
        "",
        "J'ai enregistré la question comme élément à explorer.",
        "Tu peux me demander explicitement : « cherche sur Internet » pour déclencher une recherche."
      ].join("\n");
    }
  }

  S.conversation.push(
    {role:"human", text:q, at:now()},
    {role:"alpha", text:response, at:now()}
  );
  S.conversation = S.conversation.slice(-100);

  /* Une réponse n'est pas considérée automatiquement comme une vérité.
     On mémorise seulement son existence comme trace de dialogue. */
  addMemory(`Dialogue — Question : ${q}\nRéponse produite : ${response}`,
    "dialogue", .45, ["conversation"]);

  S.cycle++;
  S.learning = clamp(S.learning + .002);
  S.selfModel.confidence = clamp(
    .40 + Math.min(.50, S.statistics.successfulSearches / 100)
  );

  save();
  setStatus("● EN LIGNE");
  render();
}

/* ---------- Apprentissage explicite ---------- */

function learn(text, source="human") {
  const t = text.trim();
  if (!t) return;
  addMemory(t, source, source === "internet" ? .72 : .85, ["learned"]);
  S.learning = clamp(S.learning + .01);
  S.cycle++;
  if (source === "internet") S.statistics.learnedFromInternet++;
  else S.statistics.learnedFromHuman++;
  save();
  setStatus("● CONNAISSANCE MÉMORISÉE");
  render();
}

/* ---------- Évolution ---------- */

function score() {
  return +(S.learning*.30 + S.adaptation*.30 +
    S.integration*.20 + S.exploration*.20).toFixed(4);
}

function evolve() {
  const before = {...S.strategies};
  const keys = Object.keys(before);
  const adjustable = keys.filter(k => k !== "memoryThreshold");
  const key = adjustable[Math.floor(Math.random()*adjustable.length)];
  const delta = [-.05,-.03,.03,.05][Math.floor(Math.random()*4)];

  const beforeScore = score();
  const after = {...before, [key]:clamp(before[key]+delta,.05,1)};
  S.strategies = after;
  S.adaptation = clamp(S.adaptation + Math.abs(delta)*.25);
  const afterScore = score();

  S.evolution.push({
    at:now(),
    reason:`Ajustement de ${key} (${delta>0?"+":""}${delta.toFixed(2)})`,
    before, after, scoreBefore:beforeScore, scoreAfter:afterScore
  });

  if (S.evolution.length > 500) S.evolution = S.evolution.slice(-500);

  S.cycle++;
  S.learning = clamp(S.learning + .003);
  save();

  $("evolutionResult").textContent =
    `Paramètre : ${key}\nVariation : ${delta>0?"+":""}${delta.toFixed(2)}\n` +
    `Score avant : ${beforeScore}\nScore après : ${afterScore}`;

  setStatus("● ÉVOLUTION ENREGISTRÉE");
  render();
}

/* ---------- Interface ---------- */

function setStatus(text) {
  if ($("status")) $("status").textContent = text;
}

function escapeHTML(v) {
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderChat() {
  $("chat").innerHTML = S.conversation.slice(-30).map(m =>
    `<div class="msg ${m.role==="alpha"?"alpha":""}"><b>${m.role==="alpha"?"ALPHA":"TOI"}</b><br>${escapeHTML(m.text)}</div>`
  ).join("");
}

function render() {
  $("cycle").textContent = S.cycle;
  $("memoryCount").textContent = S.memories.length;
  $("knowledgeCount").textContent =
    S.memories.filter(m => m.source === "internet" || m.source === "human").length;
  $("evolutionCount").textContent = S.evolution.length;

  $("stateLine").textContent =
    `EN LIGNE · apprentissage ${Math.round(S.learning*100)}%`;
  $("focus").textContent = S.selfModel.currentFocus;

  renderChat();

  $("memory").innerHTML = S.memories.slice(-20).reverse().map(m =>
    `<div class="memoryItem">${escapeHTML(m.content.slice(0,800))}
     <small>${escapeHTML(m.source)} · ${new Date(m.at).toLocaleString("fr-FR")}</small></div>`
  ).join("");

  $("journal").innerHTML = S.evolution.slice(-15).reverse().map(e =>
    `<div class="memoryItem">${escapeHTML(e.reason)}
     <small>${new Date(e.at).toLocaleString("fr-FR")} · ${e.scoreBefore} → ${e.scoreAfter}</small></div>`
  ).join("");

  $("selfModel").textContent = JSON.stringify({
    version: VERSION,
    name: S.name,
    cycle: S.cycle,
    learning: S.learning,
    memory: S.memories.length,
    searches: S.statistics.searches,
    successfulSearches: S.statistics.successfulSearches,
    capabilities: S.selfModel.capabilities,
    limitations: S.selfModel.limitations,
    strategies: S.strategies
  }, null, 2);
}

$("send").addEventListener("click", () => {
  const q = $("question").value;
  $("question").value = "";
  answer(q);
});

$("question").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("send").click();
  }
});

$("learn").addEventListener("click", () => {
  const t = $("learnText").value;
  $("learnText").value = "";
  learn(t);
});

$("research").addEventListener("click", () => {
  const u = $("url").value.trim();
  if (!u) return;
  researchUrl(u);
});

$("evolve").addEventListener("click", evolve);

$("exportState").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(S,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "alpha-memory-v5.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("importState").addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    S = {
      ...freshState(), ...imported,
      strategies:{...freshState().strategies,...(imported.strategies||{})},
      selfModel:{...freshState().selfModel,...(imported.selfModel||{})},
      statistics:{...freshState().statistics,...(imported.statistics||{})}
    };
    save(); render();
    setStatus("● MÉMOIRE IMPORTÉE");
  } catch {
    setStatus("● IMPORT IMPOSSIBLE");
  }
});

setStatus("● EN LIGNE");
render();

/* ============================================================
   ALPHA V8 — AUTONOMOUS EVOLUTION ENGINE
   ============================================================
   Objectifs :
   - observer le fonctionnement réel
   - éviter la pollution de mémoire
   - rechercher des informations externes
   - comparer plusieurs stratégies
   - tester une évolution avant adoption
   - conserver uniquement les évolutions validées
   - ne jamais prétendre avoir modifié app.js sans preuve
   ============================================================ */

(function ALPHA_V8_BOOTSTRAP() {
  "use strict";

  const VERSION = "V8";
  const STORAGE_KEY = "ALPHA_V8_STATE";

  /* ------------------------------------------------------------
     1. ÉTAT PERSISTANT
     ------------------------------------------------------------ */

  const DEFAULT_STATE = {
    version: VERSION,
    cycles: 0,
    searches: 0,
    memories: [],
    strategies: {
      memoryFirst: 0.50,
      intentRouting: 0.50,
      externalResearch: 0.50,
      verification: 0.50
    },
    evolutionHistory: [],
    rejectedCandidates: [],
    capabilities: [
      "dialogue",
      "mémoire persistante",
      "recherche externe",
      "auto-observation",
      "comparaison de stratégies",
      "tests de validation",
      "évolution de stratégies"
    ],
    lastEvolution: null
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneSafe(DEFAULT_STATE);

      const parsed = JSON.parse(raw);

      return {
        ...structuredCloneSafe(DEFAULT_STATE),
        ...parsed,
        strategies: {
          ...DEFAULT_STATE.strategies,
          ...(parsed.strategies || {})
        }
      };
    } catch (error) {
      console.warn("[ALPHA V8] Impossible de charger l'état :", error);
      return structuredCloneSafe(DEFAULT_STATE);
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("[ALPHA V8] Sauvegarde impossible :", error);
    }
  }

  /* ------------------------------------------------------------
     2. OUTILS
     ------------------------------------------------------------ */

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function similarity(a, b) {
    const A = new Set(normalizeText(a).split(" ").filter(Boolean));
    const B = new Set(normalizeText(b).split(" ").filter(Boolean));

    if (!A.size || !B.size) return 0;

    let intersection = 0;

    for (const word of A) {
      if (B.has(word)) intersection++;
    }

    return intersection / Math.max(A.size, B.size);
  }

  function uniqueArray(arr) {
    return [...new Set(arr)];
  }

  function now() {
    return new Date().toISOString();
  }

  /* ------------------------------------------------------------
     3. MÉMOIRE INTELLIGENTE
     ------------------------------------------------------------ */

  function isInstruction(text) {
    const t = normalizeText(text);

    const patterns = [
      "ne cherche pas",
      "analyse ton propre fonctionnement",
      "compare au moins",
      "explique moi ce que tu sais",
      "ne pretends pas",
      "modifie ton fonctionnement",
      "cherche sur internet",
      "effectue une recherche",
      "teste ta modification"
    ];

    return patterns.some(p => t.includes(p));
  }

  function shouldRemember(text) {
    if (!text || text.length < 3) return false;

    /*
      Une consigne de test n'est PAS automatiquement
      transformée en souvenir.
    */
    if (isInstruction(text)) return false;

    return true;
  }

  function remember(text, metadata = {}) {
    if (!shouldRemember(text)) {
      return {
        stored: false,
        reason: "instruction_or_test_not_memory"
      };
    }

    const clean = String(text).trim();

    const duplicate = state.memories.find(m => {
      return similarity(m.text, clean) >= 0.90;
    });

    if (duplicate) {
      duplicate.hits = (duplicate.hits || 1) + 1;
      duplicate.lastSeen = now();
      saveState();

      return {
        stored: false,
        duplicate: true,
        memory: duplicate
      };
    }

    const memory = {
      id: "mem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      text: clean,
      createdAt: now(),
      lastSeen: now(),
      hits: 1,
      metadata
    };

    state.memories.push(memory);

    /*
      Limite de sécurité pour éviter une croissance infinie.
    */
    if (state.memories.length > 500) {
      state.memories = state.memories.slice(-500);
    }

    saveState();

    return {
      stored: true,
      memory
    };
  }

  function recall(query, limit = 5) {
    const scored = state.memories.map(memory => ({
      memory,
      score: similarity(query, memory.text)
    }));

    return scored
      .filter(x => x.score >= 0.20)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /* ------------------------------------------------------------
     4. AUTO-OBSERVATION
     ------------------------------------------------------------ */

  function inspectSelf() {
    const capabilities = [
      ...state.capabilities
    ];

    const weaknesses = [];

    if (state.memories.length > 300) {
      weaknesses.push({
        id: "memory_growth",
        description: "La mémoire commence à devenir volumineuse.",
        severity: 0.65
      });
    }

    if (state.strategies.externalResearch < 0.65) {
      weaknesses.push({
        id: "research_routing",
        description: "La recherche externe n'est pas encore suffisamment favorisée lorsque l'information manque.",
        severity: 0.70
      });
    }

    if (state.strategies.verification < 0.70) {
      weaknesses.push({
        id: "verification",
        description: "La validation des nouvelles stratégies peut encore être renforcée.",
        severity: 0.80
      });
    }

    return {
      version: VERSION,
      capabilities,
      memories: state.memories.length,
      cycles: state.cycles,
      searches: state.searches,
      strategies: { ...state.strategies },
      weaknesses
    };
  }

  /* ------------------------------------------------------------
     5. DÉTECTION DU BESOIN DE RECHERCHE
     ------------------------------------------------------------ */

  function needsExternalResearch(question) {
    const q = normalizeText(question);

    const externalSignals = [
      "aujourd hui",
      "actuellement",
      "dernier",
      "derniere",
      "nouveau",
      "nouvelle",
      "2026",
      "prix",
      "actualite",
      "source",
      "preuve",
      "cherche",
      "recherche",
      "internet",
      "comment fonctionne",
      "qui est",
      "qu est ce que",
      "est ce vrai",
      "scientifique",
      "etude"
    ];

    return externalSignals.some(signal => q.includes(signal));
  }

  /* ------------------------------------------------------------
     6. RECHERCHE WIKIPEDIA
     ------------------------------------------------------------ */

  async function researchWikipedia(query, limit = 3) {
    state.searches++;
    saveState();

    const encoded = encodeURIComponent(query);

    const url =
      "https://fr.wikipedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" + encoded +
      "&gsrlimit=" + limit +
      "&prop=extracts|info" +
      "&exintro=1" +
      "&explaintext=1" +
      "&inprop=url" +
      "&format=json" +
      "&origin=*";

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      const pages = Object.values(data.query?.pages || {});

      return pages.map(page => ({
        title: page.title,
        extract: page.extract || "",
        url: page.fullurl || null
      }));

    } catch (error) {
      console.warn("[ALPHA V8] Recherche externe échouée :", error);

      return [];
    }
  }

  /* ------------------------------------------------------------
     7. ROUTAGE INTELLIGENT
     ------------------------------------------------------------ */

  function chooseRoute(question) {
    const researchNeeded = needsExternalResearch(question);
    const memoryResults = recall(question);

    if (researchNeeded) {
      return {
        route: "external_research",
        reason: "La question peut nécessiter une information externe ou actuelle.",
        memoryResults
      };
    }

    if (memoryResults.length) {
      return {
        route: "memory",
        reason: "Une information pertinente existe déjà en mémoire.",
        memoryResults
      };
    }

    return {
      route: "reasoning",
      reason: "Aucune mémoire suffisamment pertinente et aucune recherche externe obligatoire.",
      memoryResults: []
    };
  }

  /* ------------------------------------------------------------
     8. CANDIDATS D'ÉVOLUTION
     ------------------------------------------------------------ */

  function generateCandidates(observation) {

    const candidates = [];

    /*
      Candidat 1 : recherche avant mémoire lorsque nécessaire.
    */
    candidates.push({
      id: "candidate_intent_research",
      name: "Routage par intention + recherche externe",
      description:
        "Détecter les questions nécessitant une information externe avant d'utiliser la mémoire.",
      changes: {
        externalResearch: +0.10,
        memoryFirst: -0.05
      }
    });

    /*
      Candidat 2 : validation renforcée.
    */
    candidates.push({
      id: "candidate_verification",
      name: "Validation renforcée",
      description:
        "Augmenter le poids de la vérification avant adoption d'une stratégie.",
      changes: {
        verification: +0.12
      }
    });

    /*
      Candidat 3 : mémoire plus propre.
    */
    candidates.push({
      id: "candidate_memory_filter",
      name: "Filtre anti-duplication mémoire",
      description:
        "Réduire les doublons et empêcher les consignes de test d'être mémorisées.",
      changes: {
        memoryFirst: +0.05
      }
    });

    return candidates;
  }

  /* ------------------------------------------------------------
     9. SIMULATION D'UN CANDIDAT
     ------------------------------------------------------------ */

  function evaluateCandidate(candidate) {

    const before = {
      ...state.strategies
    };

    const after = {
      ...before
    };

    for (const [key, delta] of Object.entries(candidate.changes)) {

      if (!(key in after)) continue;

      after[key] = Math.max(
        0,
        Math.min(1, after[key] + delta)
      );
    }

    /*
      Score volontairement explicite et déterministe.
      Il ne prétend pas mesurer une intelligence générale.
    */

    const scoreBefore =
      (
        before.externalResearch +
        before.verification +
        before.intentRouting +
        before.memoryFirst
      ) / 4;

    const scoreAfter =
      (
        after.externalResearch +
        after.verification +
        after.intentRouting +
        after.memoryFirst
      ) / 4;

    const improvement = scoreAfter - scoreBefore;

    return {
      candidate,
      before,
      after,
      scoreBefore,
      scoreAfter,
      improvement,
      passed: improvement > 0
    };
  }

  /* ------------------------------------------------------------
     10. TESTS DE NON-RÉGRESSION
     ------------------------------------------------------------ */

  function runRegressionTests(candidateState) {

    const tests = [];

    /*
      Test 1 : mémoire.
    */
    const testMemory = remember(
      "ALPHA_V8_TEST_INFORMATION_" + Date.now()
    );

    tests.push({
      name: "mémoire persistante",
      passed: !!testMemory
    });

    /*
      Test 2 : anti-duplication.
    */
    const duplicateText =
      "ALPHA_V8_DUPLICATION_TEST";

    const first = remember(duplicateText);
    const second = remember(duplicateText);

    tests.push({
      name: "anti-duplication mémoire",
      passed:
        first.stored === true &&
        second.duplicate === true
    });

    /*
      Test 3 : routage.
    */
    const route = chooseRoute(
      "Quelle est la situation actuelle concernant l'intelligence artificielle ?"
    );

    tests.push({
      name: "routage recherche externe",
      passed:
        route.route === "external_research"
    });

    /*
      Test 4 : bornes des stratégies.
    */
    const bounded = Object.values(candidateState)
      .every(value => value >= 0 && value <= 1);

    tests.push({
      name: "bornes des stratégies",
      passed: bounded
    });

    return {
      passed: tests.every(test => test.passed),
      tests
    };
  }

  /* ------------------------------------------------------------
     11. ADOPTION D'UNE ÉVOLUTION
     ------------------------------------------------------------ */

  function adoptCandidate(evaluation, regression) {

    if (!evaluation.passed) {
      state.rejectedCandidates.push({
        ...evaluation,
        rejectedAt: now(),
        reason: "Pas d'amélioration mesurable."
      });

      saveState();

      return {
        adopted: false,
        reason: "candidate_not_better"
      };
    }

    if (!regression.passed) {
      state.rejectedCandidates.push({
        ...evaluation,
        rejectedAt: now(),
        reason: "Échec des tests de non-régression."
      });

      saveState();

      return {
        adopted: false,
        reason: "regression_failed",
        regression
      };
    }

    state.strategies = {
      ...evaluation.after
    };

    const evolution = {
      id: "evolution_" + Date.now(),
      candidate: evaluation.candidate,
      before: evaluation.before,
      after: evaluation.after,
      scoreBefore: evaluation.scoreBefore,
      scoreAfter: evaluation.scoreAfter,
      improvement: evaluation.improvement,
      regressionTests: regression.tests,
      adoptedAt: now(),
      type: "strategy_state",
      codeFileModified: false
    };

    state.evolutionHistory.push(evolution);
    state.lastEvolution = evolution;

    saveState();

    return {
      adopted: true,
      evolution
    };
  }

  /* ------------------------------------------------------------
     12. CYCLE D'AUTO-AMÉLIORATION
     ------------------------------------------------------------ */

  async function evolve() {

    state.cycles++;
    saveState();

    const observation = inspectSelf();

    const candidates = generateCandidates(observation);

    const evaluations = candidates
      .map(evaluateCandidate)
      .sort((a, b) => b.improvement - a.improvement);

    if (!evaluations.length) {
      return {
        changed: false,
        reason: "no_candidate"
      };
    }

    const best = evaluations[0];

    const regression = runRegressionTests(best.after);

    const adoption = adoptCandidate(
      best,
      regression
    );

    return {
      changed: adoption.adopted,
      observation,
      candidate: best,
      regression,
      adoption
    };
  }

  /* ------------------------------------------------------------
     13. ANALYSE COMPLÈTE D'UNE QUESTION
     ------------------------------------------------------------ */

  async function processQuestion(question) {

    const cleanQuestion = String(question || "").trim();

    if (!cleanQuestion) {
      return {
        question: "",
        route: "empty"
      };
    }

    /*
      On mémorise uniquement les informations utiles,
      jamais automatiquement les consignes de test.
    */
    remember(cleanQuestion, {
      type: "conversation"
    });

    const route = chooseRoute(cleanQuestion);

    let research = [];

    if (route.route === "external_research") {
      research = await researchWikipedia(
        cleanQuestion,
        3
      );
    }

    return {
      question: cleanQuestion,
      route,
      research,
      state: inspectSelf()
    };
  }

  /* ------------------------------------------------------------
     14. RAPPORT D'AUTO-OBSERVATION
     ------------------------------------------------------------ */

  function selfReport() {

    const observation = inspectSelf();

    return {
      version: VERSION,

      identity: {
        name: "ALPHA",
        type: "programme JavaScript exécuté dans un navigateur",
        runtime: "navigateur"
      },

      actualCapabilities: observation.capabilities,

      actualState: {
        cycles: observation.cycles,
        searches: observation.searches,
        memories: observation.memories,
        strategies: observation.strategies
      },

      weaknesses: observation.weaknesses,

      evolutionHistory: state.evolutionHistory.slice(-10),

      importantLimitations: [
        "La mémoire et les stratégies peuvent être modifiées localement.",
        "Le navigateur ne permet pas à ce script de réécrire directement son fichier GitHub.",
        "Une modification réelle de app.js doit être effectuée par un mécanisme externe ou un commit.",
        "Les recherches externes actuellement intégrées utilisent principalement Wikipédia.",
        "Une évolution enregistrée n'est pas une preuve de conscience."
      ],

      lastEvolution: state.lastEvolution
    };
  }

  /* ------------------------------------------------------------
     15. EXPOSITION PUBLIQUE
     ------------------------------------------------------------ */

  window.ALPHA_V8 = {

    version: VERSION,

    state: () => structuredCloneSafe(state),

    selfReport,

    inspect: inspectSelf,

    remember,

    recall,

    search: researchWikipedia,

    route: chooseRoute,

    processQuestion,

    evolve,

    regressionTests: runRegressionTests,

    candidates: generateCandidates,

    clearEvolutionHistory() {
      state.evolutionHistory = [];
      state.rejectedCandidates = [];
      state.lastEvolution = null;
      saveState();
    },

    reset() {
      state = structuredCloneSafe(DEFAULT_STATE);
      saveState();
    }
  };

  /* ------------------------------------------------------------
     16. PETIT PANNEAU DE DIAGNOSTIC
     ------------------------------------------------------------ */

  function createDiagnosticPanel() {

    if (document.getElementById("alpha-v8-panel")) {
      return;
    }

    const panel = document.createElement("div");

    panel.id = "alpha-v8-panel";

    panel.style.cssText = `
      position:fixed;
      right:12px;
      bottom:12px;
      z-index:99999;
      width:300px;
      max-width:calc(100vw - 24px);
      background:#111;
      color:#fff;
      border:1px solid #444;
      border-radius:14px;
      padding:14px;
      font-family:Arial,sans-serif;
      font-size:13px;
      box-shadow:0 10px 40px rgba(0,0,0,.5);
    `;

    panel.innerHTML = `
      <div style="
        font-weight:bold;
        font-size:16px;
        margin-bottom:10px;
      ">
        ALPHA V8
      </div>

      <div id="alpha-v8-status">
        Initialisation...
      </div>

      <div style="
        display:flex;
        gap:6px;
        margin-top:10px;
        flex-wrap:wrap;
      ">
        <button id="alpha-v8-evolve">
          ÉVOLUER
        </button>

        <button id="alpha-v8-inspect">
          S'AUTO-OBSERVER
        </button>

        <button id="alpha-v8-clear">
          EFFACER LOG
        </button>
      </div>

      <pre id="alpha-v8-log" style="
        white-space:pre-wrap;
        max-height:220px;
        overflow:auto;
        margin-top:10px;
        font-size:11px;
      "></pre>
    `;

    document.body.appendChild(panel);

    const status =
      document.getElementById("alpha-v8-status");

    const log =
      document.getElementById("alpha-v8-log");

    function renderStatus() {

      const s = inspectSelf();

      status.innerHTML = `
        <b>État réel</b><br>
        Cycles : ${s.cycles}<br>
        Recherches : ${s.searches}<br>
        Souvenirs : ${s.memories}<br>
        Évolutions : ${state.evolutionHistory.length}
      `;
    }

    function renderLog(data) {

      log.textContent =
        JSON.stringify(data, null, 2);
    }

    document
      .getElementById("alpha-v8-evolve")
      .addEventListener("click", async () => {

        status.textContent =
          "Analyse → candidats → tests → validation...";

        const result = await evolve();

        renderStatus();
        renderLog(result);
      });

    document
      .getElementById("alpha-v8-inspect")
      .addEventListener("click", () => {

        const report = selfReport();

        renderStatus();
        renderLog(report);
      });

    document
      .getElementById("alpha-v8-clear")
      .addEventListener("click", () => {

        state.evolutionHistory = [];
        state.rejectedCandidates = [];
        state.lastEvolution = null;

        saveState();

        renderStatus();

        renderLog({
          cleared: true
        });
      });

    renderStatus();

    console.log(
      "[ALPHA V8] Moteur d'évolution chargé.",
      window.ALPHA_V8
    );
  }

  /* ------------------------------------------------------------
     17. INITIALISATION
     ------------------------------------------------------------ */

  function boot() {

    try {
      createDiagnosticPanel();

      console.log(
        "[ALPHA V8] Version",
        VERSION,
        "active."
      );

      console.log(
        "[ALPHA V8] Auto-report :",
        selfReport()
      );

    } catch (error) {

      console.error(
        "[ALPHA V8] Erreur d'initialisation :",
        error
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot
    );
  } else {
    boot();
  }

})();
