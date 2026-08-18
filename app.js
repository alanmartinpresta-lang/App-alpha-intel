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
