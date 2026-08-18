/* ============================================================
   ALPHA INTEL V4
   Mémoire persistante + apprentissage + recherche autonome
   Fonctionne directement dans GitHub Pages / navigateur
   ============================================================ */

const STORAGE_KEY = "alpha_v4_state";

const now = () => new Date().toISOString();

const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + "-" + Math.random().toString(36).slice(2);

const clamp = (x, min = 0, max = 1) =>
  Math.max(min, Math.min(max, x));

const escapeHTML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

/* ============================================================
   ETAT INITIAL
   ============================================================ */

function freshState() {
  return {
    version: 4,
    name: "ALPHA",

    cycle: 0,

    learning: 0.50,
    exploration: 0.50,
    adaptation: 0.50,
    integration: 1,

    memories: [],
    evolution: [],
    conversation: [],

    strategies: {
      exploration: 0.60,
      verification: 0.75,
      memoryThreshold: 0.45,
      reflection: 0.60,
      novelty: 0.55
    },

    selfModel: {
      currentFocus:
        "comprendre, apprendre, rechercher et améliorer ses stratégies",

      confidence: 0.50,

      capabilities: [
        "mémoire persistante",
        "apprentissage",
        "dialogue",
        "recherche",
        "auto-observation",
        "évolution des stratégies"
      ],

      limitations: [
        "fonctionne lorsque la page est ouverte",
        "Internet dépend des capacités du navigateur",
        "ne possède aucune conscience démontrée"
      ]
    },

    statistics: {
      searches: 0,
      successfulSearches: 0,
      learnedFromInternet: 0,
      learnedFromHuman: 0
    },

    updatedAt: now()
  };
}

/* ============================================================
   CHARGEMENT MEMOIRE
   ============================================================ */

let S = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return freshState();
    }

    const parsed = JSON.parse(saved);

    return {
      ...freshState(),
      ...parsed,
      strategies: {
        ...freshState().strategies,
        ...(parsed.strategies || {})
      },
      selfModel: {
        ...freshState().selfModel,
        ...(parsed.selfModel || {})
      },
      statistics: {
        ...freshState().statistics,
        ...(parsed.statistics || {})
      }
    };
  } catch {
    return freshState();
  }
})();

/* ============================================================
   SAUVEGARDE
   ============================================================ */

function save() {
  S.updatedAt = now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (error) {
    console.warn("Impossible de sauvegarder la mémoire :", error);
  }
}

/* ============================================================
   MEMOIRE
   ============================================================ */

function addMemory(content, source = "human", confidence = 0.70) {
  if (!content || !String(content).trim()) return;

  S.memories.push({
    id: uid(),
    content: String(content).slice(0, 12000),
    source,
    confidence: clamp(confidence),
    at: now()
  });

  /*
     On conserve beaucoup de souvenirs mais on évite
     que le stockage local du navigateur devienne énorme.
  */

  if (S.memories.length > 5000) {
    S.memories = S.memories.slice(-5000);
  }
}

/* ============================================================
   ANALYSE DES MOTS
   ============================================================ */

function words(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z0-9]{3,}/g) || []
  );
}

/* ============================================================
   RAPPEL DE MEMOIRE
   ============================================================ */

function recall(query) {
  const queryWords = words(query);

  if (!queryWords.size) return [];

  return S.memories
    .map(memory => {
      const memoryWords = words(memory.content);

      let overlap = 0;

      for (const word of queryWords) {
        if (memoryWords.has(word)) {
          overlap++;
        }
      }

      const score =
        overlap +
        memory.confidence * 0.25;

      return {
        memory,
        score
      };
    })
    .filter(item => item.score >= S.strategies.memoryThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.memory);
}

/* ============================================================
   DETECTION DES QUESTIONS
   ============================================================ */

function needsResearch(question, memories) {
  if (!memories.length) return true;

  const q = question.toLowerCase();

  const researchSignals = [
    "qui",
    "quoi",
    "comment",
    "pourquoi",
    "quand",
    "où",
    "ou ",
    "combien",
    "quelle",
    "quel",
    "est-ce",
    "existe",
    "actualité",
    "dernier",
    "dernière",
    "aujourd'hui",
    "maintenant",
    "récent",
    "recherche",
    "cherche",
    "trouve",
    "internet",
    "information"
  ];

  return researchSignals.some(signal => q.includes(signal))
    && memories.length < 2;
}

/* ============================================================
   RECHERCHE WIKIPEDIA
   ============================================================ */

async function searchWikipedia(query) {

  const endpoint =
    "https://fr.wikipedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" +
    encodeURIComponent(query) +
    "&gsrlimit=5" +
    "&prop=extracts" +
    "&exintro=1" +
    "&explaintext=1" +
    "&format=json" +
    "&origin=*";

  try {

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Wikipedia HTTP " + response.status);
    }

    const data = await response.json();

    const pages = Object.values(
      data.query?.pages || {}
    );

    if (!pages.length) {
      return [];
    }

    return pages.map(page => ({
      title: page.title,
      text: page.extract || "",
      url:
        "https://fr.wikipedia.org/wiki/" +
        encodeURIComponent(page.title.replaceAll(" ", "_"))
    }));

  } catch (error) {

    console.warn("Recherche Wikipedia impossible :", error);

    return [];
  }
}

/* ============================================================
   RECHERCHE INTERNET AUTOMATIQUE
   ============================================================ */

async function autonomousResearch(question) {

  S.statistics.searches++;

  updateResearchStatus(
    "Recherche autonome en cours…"
  );

  const results = await searchWikipedia(question);

  if (!results.length) {

    updateResearchStatus(
      "Aucune source exploitable trouvée."
    );

    save();
    render();

    return null;
  }

  S.statistics.successfulSearches++;

  /*
     On sélectionne les informations les plus utiles.
  */

  const useful = results
    .filter(result => result.text)
    .slice(0, 3);

  for (const result of useful) {

    const memoryText =
      `Source : Wikipedia\n` +
      `Sujet : ${result.title}\n` +
      `Information : ${result.text}\n` +
      `URL : ${result.url}`;

    addMemory(
      memoryText,
      "internet",
      0.70
    );

    S.statistics.learnedFromInternet++;
  }

  save();

  updateResearchStatus(
    `${useful.length} source(s) trouvée(s) et mémorisée(s).`
  );

  render();

  return useful;
}

/* ============================================================
   RECHERCHE DANS LE CODE D'ALPHA
   ============================================================ */

async function searchOwnKnowledge(question) {

  const memories = recall(question);

  if (!memories.length) {
    return null;
  }

  return memories;
}

/* ============================================================
   REPONSE D'ALPHA
   ============================================================ */

async function answer(question) {

  const q = question.trim();

  if (!q) return;

  addMemory(
    "Question humaine : " + q,
    "human",
    1
  );

  S.statistics.learnedFromHuman++;

  let memories =
    await searchOwnKnowledge(q);

  let researched = false;
  let sources = [];

  /*
     SI ALPHA NE SAIT PAS :
     recherche automatique.
  */

  if (needsResearch(q, memories)) {

    const results =
      await autonomousResearch(q);

    if (results && results.length) {

      researched = true;
      sources = results;

      memories =
        await searchOwnKnowledge(q);
    }
  }

  let response = "";

  const lower = q.toLowerCase();

  /* ----------------------------------------------------------
     IDENTITE
     ---------------------------------------------------------- */

  if (
    /qui es tu|qui es-tu|ton nom|tu t'appelles|comment tu t'appelles/
      .test(lower)
  ) {

    response =
      `Je suis ${S.name}. ` +
      `Je possède actuellement une mémoire persistante, ` +
      `des mécanismes d'apprentissage, de recherche et ` +
      `d'adaptation de mes stratégies. ` +
      `Mon cycle actuel est ${S.cycle}.`;

  }

  /* ----------------------------------------------------------
     ETAT
     ---------------------------------------------------------- */

  else if (
    /comment vas tu|comment vas-tu|ton etat|ton état|que fais tu|que fais-tu/
      .test(lower)
  ) {

    response =
      `Je fonctionne actuellement au cycle ${S.cycle}. ` +
      `Mon niveau d'apprentissage est ` +
      `${Math.round(S.learning * 100)} %. ` +
      `J'ai ${S.memories.length} souvenirs enregistrés ` +
      `et ${S.statistics.searches} recherche(s) effectuée(s).`;

  }

  /* ----------------------------------------------------------
     MEMOIRE TROUVEE
     ---------------------------------------------------------- */

  else if (memories.length) {

    const selected =
      memories.slice(0, 3);

    response =
      "J'ai retrouvé dans ma mémoire :\n\n" +
      selected
        .map(m => {
          return `• ${m.content.slice(0, 1800)}`;
        })
        .join("\n\n");

  }

  /* ----------------------------------------------------------
     RECHERCHE REUSSIE
     ---------------------------------------------------------- */

  else if (researched && sources.length) {

    response =
      "Je n'avais pas suffisamment d'information en mémoire. " +
      "J'ai donc effectué une recherche et trouvé :\n\n" +
      sources
        .map(source =>
          `• ${source.title}\n${source.text.slice(0, 1200)}`
        )
        .join("\n\n");

  }

  /* ----------------------------------------------------------
     RIEN TROUVE
     ---------------------------------------------------------- */

  else {

    response =
      "Je ne possède pas encore suffisamment d'information " +
      "pour répondre correctement à cette question. " +
      "Je l'ai enregistrée comme élément à explorer.";
  }

  /*
     Alpha mémorise également ce qu'il vient de produire.
  */

  addMemory(
    `Question : ${q}\nRéponse : ${response}`,
    "alpha",
    0.65
  );

  S.conversation.push(
    {
      role: "human",
      text: q,
      at: now()
    },
    {
      role: "alpha",
      text: response,
      at: now()
    }
  );

  S.conversation =
    S.conversation.slice(-100);

  S.cycle++;

  S.learning =
    clamp(S.learning + 0.002);

  save();

  render();
}

/* ============================================================
   APPRENTISSAGE DIRECT
   ============================================================ */

function learn(text, source = "human") {

  if (!text || !text.trim()) return;

  addMemory(
    text.trim(),
    source,
    source === "internet" ? 0.70 : 0.80
  );

  S.learning =
    clamp(S.learning + 0.01);

  S.cycle++;

  if (source === "internet") {
    S.statistics.learnedFromInternet++;
  } else {
    S.statistics.learnedFromHuman++;
  }

  save();

  render();
}

/* ============================================================
   EVOLUTION
   ============================================================ */

function score() {

  return +(
    S.learning * 0.30 +
    S.adaptation * 0.30 +
    S.integration * 0.20 +
    S.exploration * 0.20
  ).toFixed(4);
}

function evolve() {

  const before = {
    ...S.strategies
  };

  const keys =
    Object.keys(before);

  const key =
    keys[Math.floor(Math.random() * keys.length)];

  const variations = [
    -0.05,
    -0.03,
    0.03,
    0.05
  ];

  const delta =
    variations[
      Math.floor(
        Math.random() * variations.length
      )
    ];

  const scoreBefore =
    score();

  const after = {
    ...before,
    [key]:
      clamp(
        before[key] + delta,
        0.05,
        1
      )
  };

  S.strategies =
    after;

  S.adaptation =
    clamp(
      S.adaptation +
      Math.abs(delta) * 0.25
    );

  const scoreAfter =
    score();

  const evolution = {
    at: now(),
    reason:
      `Ajustement de ${key} ` +
      `(${delta > 0 ? "+" : ""}${delta.toFixed(2)})`,
    before,
    after,
    scoreBefore,
    scoreAfter
  };

  S.evolution.push(
    evolution
  );

  S.cycle++;

  save();

  render();

  return evolution;
}

/* ============================================================
   RECHERCHE MANUELLE D'UNE URL
   ============================================================ */

async function researchURL(url) {

  try {

    const parsed =
      new URL(url);

    if (
      !/^https?:$/.test(
        parsed.protocol
      )
    ) {
      throw new Error(
        "URL HTTP/HTTPS uniquement"
      );
    }

    updateResearchStatus(
      "Lecture de la source…"
    );

    const response =
      await fetch(parsed.href);

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    const html =
      await response.text();

    const text =
      html
        .replace(
          /<script[\s\S]*?<\/script>/gi,
          " "
        )
        .replace(
          /<style[\s\S]*?<\/style>/gi,
          " "
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (!text) {
      throw new Error(
        "Aucun texte exploitable"
      );
    }

    learn(
      `Source Internet : ${url}\n${text.slice(0, 10000)}`,
      "internet"
    );

    updateResearchStatus(
      "Source enregistrée dans la mémoire."
    );

    return text.slice(0, 3000);

  } catch (error) {

    const message =
      "Lecture impossible : " +
      error.message +
      ". Certains sites bloquent les requêtes depuis un navigateur.";

    updateResearchStatus(
      message
    );

    return message;
  }
}

/* ============================================================
   INTERFACE
   ============================================================ */

function updateResearchStatus(text) {

  if (
    typeof researchResult !== "undefined" &&
    researchResult
  ) {
    researchResult.textContent =
      text;
  }
}

function render() {

  if (typeof cycle !== "undefined" && cycle) {
    cycle.textContent =
      S.cycle;
  }

  if (
    typeof memoryCount !== "undefined" &&
    memoryCount
  ) {
    memoryCount.textContent =
      S.memories.length;
  }

  if (
    typeof knowledgeCount !== "undefined" &&
    knowledgeCount
  ) {
    knowledgeCount.textContent =
      S.memories.filter(
        m =>
          m.source === "internet" ||
          m.source === "human"
      ).length;
  }

  if (
    typeof evolutionCount !== "undefined" &&
    evolutionCount
  ) {
    evolutionCount.textContent =
      S.evolution.length;
  }

  if (
    typeof stateLine !== "undefined" &&
    stateLine
  ) {

    stateLine.textContent =
      `Actif · apprentissage ` +
      `${Math.round(S.learning * 100)}% · ` +
      `adaptation ` +
      `${Math.round(S.adaptation * 100)}%`;
  }

  if (
    typeof focus !== "undefined" &&
    focus
  ) {
    focus.textContent =
      S.selfModel.currentFocus;
  }

  if (
    typeof selfModel !== "undefined" &&
    selfModel
  ) {

    selfModel.textContent =
      JSON.stringify(
        {
          ...S.selfModel,
          strategies:
            S.strategies,
          statistics:
            S.statistics
        },
        null,
        2
      );
  }

  if (
    typeof memory !== "undefined" &&
    memory
  ) {

    memory.innerHTML =
      S.memories
        .slice(-40)
        .reverse()
        .map(m => `
          <div class="memoryItem">
            <b>[${escapeHTML(m.source)}]</b>
            ${escapeHTML(m.content)}
            <small>
              ${new Date(m.at).toLocaleString("fr-FR")}
            </small>
          </div>
        `)
        .join("");
  }

  if (
    typeof journal !== "undefined" &&
    journal
  ) {

    journal.innerHTML =
      S.evolution
        .slice(-20)
        .reverse()
        .map(e => `
          <div class="memoryItem">
            <b>
              ${escapeHTML(e.reason)}
            </b>
            <small>
              ${new Date(e.at).toLocaleString("fr-FR")}
              · ${e.scoreBefore}
              → ${e.scoreAfter}
            </small>
          </div>
        `)
        .join("");
  }

  if (
    typeof chat !== "undefined" &&
    chat
  ) {

    chat.innerHTML =
      S.conversation
        .slice(-40)
        .map(message => `
          <div class="msg ${
            message.role === "alpha"
              ? "alpha"
              : ""
          }">
            <b>
              ${
                message.role === "alpha"
                  ? "ALPHA"
                  : "TOI"
              }
            </b>
            <br>
            ${escapeHTML(message.text)}
          </div>
        `)
        .join("");
  }

  if (
    typeof status !== "undefined" &&
    status
  ) {
    status.textContent =
      "● MÉMOIRE ACTIVE · RECHERCHE ACTIVE";
  }
}

/* ============================================================
   BOUTON ENVOYER
   ============================================================ */

if (
  typeof send !== "undefined" &&
  send
) {

  send.onclick =
    async () => {

      const q =
        question.value.trim();

      if (!q) return;

      question.value = "";

      await answer(q);
    };
}

/* ============================================================
   ENTREE CLAVIER
   ============================================================ */

if (
  typeof question !== "undefined" &&
  question
) {

  question.onkeydown =
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        if (
          typeof send !== "undefined" &&
          send
        ) {
          send.click();
        }
      }
    };
}

/* ============================================================
   APPRENTISSAGE MANUEL
   ============================================================ */

if (
  typeof learnButton !== "undefined" &&
  learnButton
) {

  learnButton.onclick =
    () => {

      const text =
        learnText.value.trim();

      if (!text) return;

      learn(
        text,
        "human"
      );

      learnText.value = "";
    };
}

/*
   Compatibilité avec l'ancien HTML
   qui utilise simplement "learn".
*/

if (
  typeof learn !== "undefined" &&
  typeof window.learnButton === "undefined"
) {
  // Rien à faire.
}

/* ============================================================
   EVOLUTION
   ============================================================ */

if (
  typeof evolveButton !== "undefined" &&
  evolveButton
) {

  evolveButton.onclick =
    () => {

      const result =
        evolve();

      if (
        typeof evolutionResult !== "undefined" &&
        evolutionResult
      ) {

        evolutionResult.textContent =
          JSON.stringify(
            result,
            null,
            2
          );
      }
    };
}

/*
   Compatibilité avec l'ancien bouton
   nommé "evolve".
*/

if (
  typeof evolve !== "undefined" &&
  evolve instanceof HTMLElement
) {

  evolve.onclick =
    () => {

      const result =
        window.alphaEvolve
          ? window.alphaEvolve()
          : null;

      if (
        typeof evolutionResult !== "undefined" &&
        evolutionResult &&
        result
      ) {

        evolutionResult.textContent =
          JSON.stringify(
            result,
            null,
            2
          );
      }
    };
}

/* ============================================================
   RECHERCHE URL
   ============================================================ */

if (
  typeof researchButton !== "undefined" &&
  researchButton
) {

  researchButton.onclick =
    async () => {

      const urlValue =
        url.value.trim();

      if (!urlValue) return;

      const result =
        await researchURL(
          urlValue
        );

      if (
        typeof researchResult !== "undefined" &&
        researchResult
      ) {
        researchResult.textContent =
          result;
      }
    };
}

/*
   Compatibilité avec ancien HTML
*/

if (
  typeof research !== "undefined" &&
  research instanceof HTMLElement
) {

  research.onclick =
    async () => {

      const urlValue =
        url.value.trim();

      if (!urlValue) return;

      const result =
        await researchURL(
          urlValue
        );

      if (
        typeof researchResult !== "undefined" &&
        researchResult
      ) {
        researchResult.textContent =
          result;
      }
    };
}

/* ============================================================
   EXPORT MEMOIRE
   ============================================================ */

if (
  typeof exportState !== "undefined" &&
  exportState
) {

  exportState.onclick =
    () => {

      const blob =
        new Blob(
          [
            JSON.stringify(
              S,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

      const link =
        document.createElement("a");

      link.href =
        URL.createObjectURL(blob);

      link.download =
        "alpha-memory.json";

      link.click();

      URL.revokeObjectURL(
        link.href
      );
    };
}

/* ============================================================
   IMPORT MEMOIRE
   ============================================================ */

if (
  typeof importState !== "undefined" &&
  importState
) {

  importState.onchange =
    event => {

      const file =
        event.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        () => {

          try {

            const imported =
              JSON.parse(
                reader.result
              );

            S = {
              ...freshState(),
              ...imported
            };

            save();

            render();

          } catch {

            alert(
              "Mémoire Alpha invalide."
            );
          }
        };

      reader.readAsText(file);
    };
}

/* ============================================================
   INITIALISATION
   ============================================================ */

render();

/*
   Expose quelques fonctions pour
   permettre une évolution future.
*/

window.Alpha = {
  state: () => S,

  ask: question =>
    answer(question),

  learn: text =>
    learn(text, "human"),

  research: question =>
    autonomousResearch(question),

  evolve: () =>
    evolve(),

  save: () =>
    save(),

  exportMemory: () =>
    JSON.stringify(
      S,
      null,
      2
    )
};

console.log(
  "ALPHA V4 — mémoire active, apprentissage actif, recherche autonome."
);
