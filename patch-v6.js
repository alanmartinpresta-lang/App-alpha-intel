/* ============================================================
   ALPHA INTEL V6 PATCH
   Mémoire propre + auto-observation + recherche intelligente
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "alpha_v4_state";

  function loadAlphaState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveAlphaState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Alpha V6 : mémoire indisponible", e);
    }
  }

  /* ----------------------------------------------------------
     1. NETTOYAGE DE LA MÉMOIRE
     Les anciennes questions ne doivent PAS devenir du savoir.
     ---------------------------------------------------------- */

  function cleanMemory() {
    const S = loadAlphaState();

    if (!Array.isArray(S.memories)) return;

    S.memories = S.memories.filter(m => {
      if (!m) return false;

      const source = String(m.source || "").toLowerCase();
      const content = String(m.content || "").toLowerCase();

      /*
       * On conserve les vraies connaissances :
       * internet / wikipedia / apprentissage / système.
       *
       * On élimine les anciennes traces de questions humaines
       * qui polluaient les réponses.
       */

      if (
        source === "human" ||
        source === "human_question" ||
        source === "dialogue"
      ) {
        return false;
      }

      if (
        content.startsWith("question humaine :") ||
        content.startsWith("question :") ||
        content.includes("je n'ai pas encore de souvenir pertinent")
      ) {
        return false;
      }

      return true;
    });

    saveAlphaState(S);
  }


  /* ----------------------------------------------------------
     2. REQUÊTE DE RECHERCHE INTELLIGENTE
     ---------------------------------------------------------- */

  function buildResearchQuery(question) {

    let q = String(question || "").trim();

    q = q
      .replace(/^(cherche|recherche|explore|trouve|vérifie|verifie)\s+/i, "")
      .replace(/\b(sur internet|sur le web|en ligne)\b/gi, "")
      .replace(/\b(s'il te plaît|stp|svp)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const stopWords = new Set([
      "qui",
      "est",
      "tu",
      "es",
      "quoi",
      "que",
      "c'est",
      "ce",
      "fais",
      "faire",
      "sais",
      "peux",
      "peut",
      "donne",
      "moi",
      "une",
      "un",
      "la",
      "le",
      "les",
      "des",
      "du",
      "de",
      "ton",
      "ta",
      "tes",
      "mon",
      "ma",
      "mes",
      "avec",
      "pour",
      "dans",
      "sur",
      "alors"
    ]);

    const words = q
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .filter(w => !stopWords.has(w));

    if (words.length >= 2) {
      return words.join(" ");
    }

    return q;
  }


  /* ----------------------------------------------------------
     3. RECHERCHE WIKIPÉDIA PLUS PROPRE
     ---------------------------------------------------------- */

  async function alphaResearch(question) {

    const query = buildResearchQuery(question);

    if (!query) return [];

    console.log("ALPHA V6 — recherche :", query);

    const endpoint =
      "https://fr.wikipedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" + encodeURIComponent(query) +
      "&gsrlimit=8" +
      "&prop=extracts" +
      "&exintro=1" +
      "&explaintext=1" +
      "&format=json" +
      "&origin=*";

    try {

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      const results = Object.values(
        data.query?.pages || {}
      )
      .map(page => ({
        title: page.title,
        text: page.extract || "",
        url:
          "https://fr.wikipedia.org/wiki/" +
          encodeURIComponent(
            page.title.replaceAll(" ", "_")
          )
      }))
      .filter(x => x.text);

      /*
       * Classe les résultats selon leur proximité
       * avec la question réelle.
       */

      const queryWords = new Set(
        query.toLowerCase()
          .split(/\s+/)
          .filter(x => x.length >= 3)
      );

      results.forEach(result => {

        const text = (
          result.title +
          " " +
          result.text
        ).toLowerCase();

        let score = 0;

        for (const word of queryWords) {
          if (text.includes(word)) {
            score++;
          }
        }

        result.score = score;
      });

      results.sort((a, b) => b.score - a.score);

      return results.slice(0, 3);

    } catch (error) {

      console.warn(
        "ALPHA V6 — recherche impossible",
        error
      );

      return [];
    }
  }


  /* ----------------------------------------------------------
     4. ALPHA PEUT S'OBSERVER LUI-MÊME
     ---------------------------------------------------------- */

  async function alphaSelfInspection() {

    let source = "";

    try {

      const response = await fetch(
        "app.js?self=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (response.ok) {
        source = await response.text();
      }

    } catch {}

    const S = loadAlphaState();

    const capabilities = [
      "dialogue avec l'utilisateur",
      "mémoire persistante locale",
      "recherche Internet via API accessible au navigateur",
      "recherche Wikipédia",
      "apprentissage depuis des informations trouvées",
      "auto-observation de mon programme",
      "évolution de certaines stratégies",
      "conservation de connaissances entre les ouvertures de l'application"
    ];

    if (source) {

      if (/localStorage/.test(source)) {
        capabilities.push(
          "stockage persistant localStorage"
        );
      }

      if (/searchWikipedia/.test(source)) {
        capabilities.push(
          "moteur de recherche Wikipédia"
        );
      }

      if (/evolve/.test(source)) {
        capabilities.push(
          "mécanisme d'évolution"
        );
      }

      if (/inspectSelf/.test(source)) {
        capabilities.push(
          "auto-inspection du code"
        );
      }
    }

    return {

      name: S.name || "ALPHA",

      version:
        S.version ||
        5,

      program: true,

      memories:
        Array.isArray(S.memories)
          ? S.memories.length
          : 0,

      conversations:
        Array.isArray(S.conversation)
          ? S.conversation.length
          : 0,

      cycles:
        Number(S.cycle || 0),

      searches:
        Number(
          S.statistics?.searches || 0
        ),

      capabilities,

      limitations: [

        "je suis actuellement un programme exécuté dans un navigateur",

        "je ne suis pas encore un modèle de langage général",

        "mes recherches dépendent des services accessibles depuis le navigateur",

        "ma mémoire persistante est actuellement liée au navigateur et à cet appareil",

        "je peux analyser mon programme mais cela ne prouve pas une conscience subjective",

        "je ne peux pas encore modifier et déployer automatiquement mon propre code"
      ]
    };
  }


  /* ----------------------------------------------------------
     5. RÉPONSES D'AUTO-OBSERVATION
     ---------------------------------------------------------- */

  function identityResponse(self) {

    return [
      `Je suis ${self.name}.`,

      "",

      "Je peux observer dans mon propre fonctionnement que je suis un programme exécuté dans un navigateur.",

      `Ma version actuelle est V${self.version}.`,

      `Je possède actuellement ${self.memories} souvenir(s).`,

      `J'ai effectué ${self.searches} recherche(s).`,

      "",

      "Je peux également inspecter certaines parties de mon propre programme pour déterminer ce que je sais réellement faire.",

      "",

      "Je ne dois cependant pas confondre cette capacité d'auto-description avec une preuve de conscience."
    ].join("\n");
  }


  function capabilitiesResponse(self) {

    return [
      "J'ai examiné mes capacités actuelles plutôt que de simplement chercher une réponse dans ma mémoire.",

      "",

      "Ce que je peux actuellement faire :",

      ...self.capabilities.map(
        capability => "• " + capability
      ),

      "",

      "Ce que je ne peux pas encore faire :",

      ...self.limitations.map(
        limitation => "• " + limitation
      ),

      "",

      "Une de mes prochaines étapes logiques serait d'identifier moi-même ces limites, de rechercher des solutions et de mesurer si elles améliorent réellement mes capacités."
    ].join("\n");
  }


  function improvementResponse(self) {

    return [
      "Je peux chercher comment améliorer mes capacités.",

      "",

      "Mon fonctionnement actuel me permet déjà de :",

      "• observer mon programme",

      "• rechercher des informations",

      "• mémoriser certaines connaissances",

      "• mesurer certaines statistiques",

      "• modifier certaines stratégies",

      "",

      "Ma limite actuelle importante est que je ne réécris pas encore automatiquement mon propre programme.",

      "",

      "Je peux toutefois identifier cette limite comme un objectif d'évolution et rechercher des méthodes permettant de progresser."
    ].join("\n");
  }


  /* ----------------------------------------------------------
     6. DÉTECTION DES QUESTIONS
     ---------------------------------------------------------- */

  function isIdentity(q) {

    return /qui es[- ]tu|qui est[- ]tu|ton nom|comment tu t['’]appelles/i
      .test(q);
  }


  function isCapabilities(q) {

    return /que (sais|peux)[- ]tu faire|qu['’]est[- ]ce que tu sais faire|tes capacités|tes capacites|capable de quoi/i
      .test(q);
  }


  function isImprovement(q) {

    return /comment.*(améliorer|ameliorer|progresser|évoluer|evoluer)|améliore[- ]toi|ameliore[- ]toi|comment peux[- ]tu progresser/i
      .test(q);
  }


  /* ----------------------------------------------------------
     7. PATCH DE LA FONCTION answer
     ---------------------------------------------------------- */

  function installAnswerPatch() {

    if (typeof window.answer !== "function") {

      console.warn(
        "ALPHA V6 : answer() n'est pas encore disponible."
      );

      return false;
    }

    const originalAnswer = window.answer;

    window.answer = async function(question) {

      const q = String(question || "").trim();

      if (!q) return;

      /*
       * On nettoie d'abord les anciennes fausses connaissances.
       */

      cleanMemory();

      /*
       * Identité
       */

      if (isIdentity(q)) {

        const self =
          await alphaSelfInspection();

        const response =
          identityResponse(self);

        if (
          typeof window.addMessage === "function"
        ) {
          window.addMessage(
            "ALPHA",
            response
          );
        }

        return;
      }


      /*
       * Capacités
       */

      if (isCapabilities(q)) {

        const self =
          await alphaSelfInspection();

        const response =
          capabilitiesResponse(self);

        if (
          typeof window.addMessage === "function"
        ) {
          window.addMessage(
            "ALPHA",
            response
          );
        }

        return;
      }


      /*
       * Amélioration
       */

      if (isImprovement(q)) {

        const self =
          await alphaSelfInspection();

        const response =
          improvementResponse(self);

        if (
          typeof window.addMessage === "function"
        ) {
          window.addMessage(
            "ALPHA",
            response
          );
        }

        return;
      }


      /*
       * Recherche explicite.
       *
       * Exemple :
       * "Cherche comment fonctionne l'IA"
       */

      if (
        /^(cherche|recherche|explore|vérifie|verifie)\b/i
          .test(q)
      ) {

        const results =
          await alphaResearch(q);

        if (!results.length) {

          if (
            typeof window.addMessage === "function"
          ) {

            window.addMessage(
              "ALPHA",
              "Je n'ai pas trouvé de source exploitable pour cette recherche."
            );
          }

          return;
        }

        const response = [

          `J'ai construit la recherche suivante : "${buildResearchQuery(q)}"`,

          "",

          "Résultats trouvés :",

          ...results.map(
            r =>
              `• ${r.title}\n${r.text.slice(0, 1400)}\nSource : ${r.url}`
          )

        ].join("\n\n");


        /*
         * Enregistre uniquement le savoir trouvé,
         * pas la question comme connaissance.
         */

        const S = loadAlphaState();

        if (!Array.isArray(S.memories)) {
          S.memories = [];
        }

        for (const r of results) {

          S.memories.push({

            id:
              Date.now() +
              "-" +
              Math.random()
                .toString(36)
                .slice(2),

            content:
              `Source : Wikipédia\n` +
              `Sujet : ${r.title}\n` +
              `Information : ${r.text}\n` +
              `URL : ${r.url}`,

            source:
              "internet",

            confidence:
              0.72,

            tags:
              [
                "web",
                "wikipedia",
                "v6"
              ],

            at:
              new Date().toISOString()
          });
        }

        S.statistics =
          S.statistics || {};

        S.statistics.searches =
          Number(
            S.statistics.searches || 0
          ) + 1;

        S.statistics.successfulSearches =
          Number(
            S.statistics.successfulSearches || 0
          ) + 1;

        S.statistics.learnedFromInternet =
          Number(
            S.statistics.learnedFromInternet || 0
          ) + results.length;

        saveAlphaState(S);

        if (
          typeof window.addMessage === "function"
        ) {

          window.addMessage(
            "ALPHA",
            response
          );
        }

        return;
      }


      /*
       * Pour toutes les autres questions :
       * on utilise le moteur original.
       */

      return originalAnswer(q);
    };

    console.log(
      "ALPHA V6 PATCH installé."
    );

    return true;
  }


  /* ----------------------------------------------------------
     8. INSTALLATION
     ---------------------------------------------------------- */

  function startPatch() {

    cleanMemory();

    if (installAnswerPatch()) {
      console.log(
        "ALPHA V6 : mémoire nettoyée + introspection + recherche améliorée."
      );
      return;
    }

    /*
     * Si app.js n'est pas encore chargé,
     * on attend un peu puis on réessaie.
     */

    setTimeout(
      startPatch,
      500
    );
  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startPatch
    );

  } else {

    startPatch();
  }

})();
