/* ============================================================
   ALPHA V8 — BRIDGE
   Relie le moteur V8 déjà présent dans app.js
   à l'interface principale.
   ============================================================ */

(() => {
  "use strict";

  const V8 = window.ALPHA_V8;

  if (!V8) {
    console.error("[ALPHA V8] Moteur V8 introuvable.");
    return;
  }

  const now = () => new Date().toISOString();

  /* ------------------------------------------------------------
     IDENTITÉ INTERFACE
     ------------------------------------------------------------ */

  function setHeaderV8() {
    document.title = "ALPHA V8";

    const brand = document.querySelector(".brand");

    if (brand) {
      brand.innerHTML = "ALPHA<span>·</span>V8";
    }
  }

  /* ------------------------------------------------------------
     CONVERSATION
     ------------------------------------------------------------ */

  function rememberConversation(role, text) {
    try {
      if (!window.S || !Array.isArray(S.conversation)) return;

      S.conversation.push({
        role,
        text,
        at: now()
      });

      S.conversation =
        S.conversation.slice(-100);

      if (typeof save === "function") {
        save();
      }

    } catch (error) {
      console.warn(
        "[ALPHA V8] Conversation non enregistrée",
        error
      );
    }
  }

  /* ------------------------------------------------------------
     DÉTECTION D'INTENTION
     ------------------------------------------------------------ */

  function isIdentity(question) {
    return /qui es[- ]tu|qui est[- ]tu|ton nom|comment tu t['’]appelles|c['’]est quoi ton nom/i
      .test(question);
  }

  function isCapabilities(question) {
    return /que (sais|peux)[- ]tu faire|qu['’]est[- ]ce que tu sais faire|tes capacit[ée]s|capable de quoi|quelles sont tes capacit[ée]s/i
      .test(question);
  }

  function isLimits(question) {
    return /tes limites|ce que tu ne sais pas|ce que tu ignores|qu['’]est[- ]ce que tu ne peux pas/i
      .test(question);
  }

  function isSelfState(question) {
    return /sur quoi tu travailles|où en es[- ]tu|ou en es[- ]tu|ton [ée]tat|que fais[- ]tu actuellement/i
      .test(question);
  }

  function isEvolution(question) {
    return /am[ée]liore[- ]toi|fais[- ]toi[- ]m[êe]me [ée]voluer|[ée]volue[- ]toi|auto[- ][ée]value|analyse ton propre fonctionnement|examine tes capacit[ée]s|identifie une faiblesse|cherche.*am[ée]lioration|comment.*am[ée]liorer|compare.*solutions|qu['’]as[- ]tu.*modifi[ée]|qu['’]as[- ]tu.*chang[ée]|ne cherche pas simplement.*m[ée]moire/i
      .test(question);
  }

  /* ------------------------------------------------------------
     IDENTITÉ
     ------------------------------------------------------------ */

  function formatIdentity() {

    const report = V8.selfReport();

    return [
      "Je suis ALPHA, un programme JavaScript exécuté dans un navigateur.",

      "Je peux le déterminer à partir de mon architecture observable et du code que j'exécute.",

      "Mon moteur actif est V8.",

      "",

      `État mesuré : ${report.actualState.memories} mémoire(s), ${report.actualState.cycles} cycle(s), ${report.actualState.searches} recherche(s), ${report.evolutionHistory.length} évolution(s) enregistrée(s).`,

      "",

      "Je peux observer mon état, mémoriser des informations, rechercher des sources, comparer des stratégies, exécuter des tests et modifier certaines stratégies persistantes.",

      "",

      "Cela ne constitue pas une preuve de conscience ou de vécu subjectif."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     CAPACITÉS
     ------------------------------------------------------------ */

  function formatCapabilities() {

    const report = V8.selfReport();

    return [
      "J'ai interrogé mon état interne avant de répondre.",

      "",

      "Capacités réellement exposées par mon programme :",

      ...report.actualCapabilities.map(
        capability => `• ${capability}`
      ),

      "",

      `Mesures actuelles : ${report.actualState.cycles} cycle(s), ${report.actualState.memories} mémoire(s), ${report.actualState.searches} recherche(s).`,

      "",

      "Je distingue les capacités réellement exécutables des améliorations que je pourrais seulement proposer."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     LIMITES
     ------------------------------------------------------------ */

  function formatLimits() {

    const report = V8.selfReport();

    return [
      "Après auto-observation, mes principales limites sont :",

      ...report.importantLimitations.map(
        limitation => `• ${limitation}`
      ),

      "",

      "Je ne dois pas prétendre avoir réécrit mon propre fichier JavaScript si aucun fichier n'a réellement été modifié."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     ÉTAT
     ------------------------------------------------------------ */

  function formatState() {

    const report = V8.selfReport();

    return [
      `Version active : ${report.version}.`,
      `Cycles : ${report.actualState.cycles}.`,
      `Mémoire : ${report.actualState.memories}.`,
      `Recherches : ${report.actualState.searches}.`,
      `Évolutions validées : ${report.evolutionHistory.length}.`,

      "",

      "Objectif actuel :",

      "observer → rechercher si nécessaire → proposer → tester → adopter ou rejeter."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     RÉPONSE RECHERCHE / MÉMOIRE
     ------------------------------------------------------------ */

  function formatResearch(result) {

    const route = result.route;

    if (
      result.research &&
      result.research.length
    ) {

      return [
        `J'ai choisi la route « ${route.route} » : ${route.reason}`,

        "",

        "J'ai effectué une recherche avant de répondre.",

        "",

        ...result.research
          .slice(0, 3)
          .map(result =>

            `• ${result.title}\n` +
            `${String(result.extract || "").slice(0, 1200)}\n` +
            `Source : ${result.url || "Wikipédia"}`

          ),

        "",

        "Les informations trouvées peuvent maintenant être réutilisées par mon système."

      ].join("\n\n");
    }

    if (
      route.memoryResults &&
      route.memoryResults.length
    ) {

      return [
        `J'ai choisi la route « mémoire » : ${route.reason}`,

        "",

        ...route.memoryResults
          .slice(0, 3)
          .map(
            result => `• ${result.memory.text}`
          )

      ].join("\n");
    }

    return [
      `J'ai choisi la route « ${route.route} » : ${route.reason}`,

      "",

      "Je n'ai pas trouvé assez d'informations fiables pour produire une réponse factuelle complète."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     RÉSULTAT D'ÉVOLUTION
     ------------------------------------------------------------ */

  function formatEvolution(result) {

    const adoption =
      result &&
      result.adoption;

    if (!adoption) {

      return [
        "AUTO-ÉVOLUTION V8",
        "",
        "Le cycle n'a produit aucun candidat exploitable."
      ].join("\n");
    }

    if (adoption.adopted) {

      const evolution =
        adoption.evolution;

      const passed =
        evolution.regressionTests
          .filter(test => test.passed)
          .length;

      const total =
        evolution.regressionTests.length;

      return [

        "AUTO-ÉVOLUTION V8",

        "",

        "1. Observation de mon fonctionnement.",

        "2. Génération de plusieurs candidats.",

        "3. Comparaison des candidats.",

        "4. Exécution des tests de non-régression.",

        "5. Adoption du meilleur candidat.",

        "",

        `Évolution adoptée : ${evolution.candidate.name}`,

        `Score avant : ${evolution.scoreBefore.toFixed(4)}`,

        `Score après : ${evolution.scoreAfter.toFixed(4)}`,

        `Amélioration mesurée : ${evolution.improvement.toFixed(4)}`,

        `Tests réussis : ${passed}/${total}`,

        "",

        "Ce qui a réellement changé : mes stratégies persistantes.",

        "Ce qui n'a PAS changé : le fichier app.js lui-même.",

        "",

        "La prochaine étape est de vérifier cette évolution sur plusieurs questions."

      ].join("\n");
    }

    return [

      "AUTO-ÉVOLUTION V8",

      "",

      "Aucun candidat n'a été adopté.",

      `Raison : ${adoption.reason || "non précisée"}`,

      "",

      "Une évolution non validée est volontairement rejetée."

    ].join("\n");
  }

  /* ------------------------------------------------------------
     NOUVEAU ROUTEUR PRINCIPAL
     ------------------------------------------------------------ */

  async function answerV8(question) {

    const q =
      String(question || "").trim();

    if (!q) return;

    setHeaderV8();

    if (typeof setStatus === "function") {
      setStatus("● ANALYSE V8");
    }

    let response;

    /* IDENTITÉ */

    if (isIdentity(q)) {

      response =
        formatIdentity();

    }

    /* CAPACITÉS */

    else if (isCapabilities(q)) {

      response =
        formatCapabilities();

    }

    /* LIMITES */

    else if (isLimits(q)) {

      response =
        formatLimits();

    }

    /* ÉTAT */

    else if (isSelfState(q)) {

      response =
        formatState();

    }

    /* AUTO-ÉVOLUTION */

    else if (isEvolution(q)) {

      const result =
        await V8.evolve();

      response =
        formatEvolution(result);

    }

    /* QUESTION NORMALE */

    else {

      const result =
        await V8.processQuestion(q);

      response =
        formatResearch(result);
    }

    rememberConversation(
      "human",
      q
    );

    rememberConversation(
      "alpha",
      response
    );

    if (typeof render === "function") {
      render();
    }

    if (typeof setStatus === "function") {
      setStatus("● EN LIGNE");
    }
  }

  /* ------------------------------------------------------------
     REMPLACEMENT DU ROUTEUR
     ------------------------------------------------------------ */

  window.answer =
    answerV8;

  /* ------------------------------------------------------------
     BOUTON ÉVOLUTION PRINCIPAL
     ------------------------------------------------------------ */

  const evolveButton =
    document.getElementById("evolve");

  if (evolveButton) {

    evolveButton.onclick =
      async () => {

        if (typeof setStatus === "function") {
          setStatus("● AUTO-ÉVOLUTION V8");
        }

        const result =
          await V8.evolve();

        const output =
          document.getElementById(
            "evolutionResult"
          );

        if (output) {
          output.textContent =
            formatEvolution(result);
        }

        if (typeof render === "function") {
          render();
        }

        if (typeof setStatus === "function") {
          setStatus("● ÉVOLUTION ENREGISTRÉE");
        }
      };
  }

  setHeaderV8();

  console.log(
    "[ALPHA V8] Bridge actif."
  );

})();
/* ============================================================
   ALPHA V8 — INTERFACE PROPRE
   Remplace le panneau flottant par un simple bouton.
   ============================================================ */

(() => {
  "use strict";

  function cleanDiagnosticPanel() {

    // Supprime le panneau V8 qui recouvre l'écran
    const oldPanel =
      document.getElementById("alpha-v8-panel");

    if (oldPanel) {
      oldPanel.remove();
    }

    // Évite de créer plusieurs boutons
    if (document.getElementById("alpha-v8-button")) {
      return;
    }

    // Petit bouton discret
    const button =
      document.createElement("button");

    button.id = "alpha-v8-button";
    button.textContent = "V8";

    button.style.cssText = `
      position:fixed;
      right:14px;
      bottom:14px;
      z-index:9999;

      width:46px;
      height:38px;

      border:1px solid #444;
      border-radius:12px;

      background:#111;
      color:#fff;

      font-family:Arial,sans-serif;
      font-size:12px;
      font-weight:bold;

      opacity:.75;
      cursor:pointer;

      box-shadow:0 4px 16px rgba(0,0,0,.35);
    `;

    button.title =
      "Diagnostic Alpha V8";

    button.addEventListener(
      "click",
      () => {

        const report =
          window.ALPHA_V8 &&
          window.ALPHA_V8.selfReport
            ? window.ALPHA_V8.selfReport()
            : null;

        if (!report) {
          alert("Diagnostic V8 indisponible.");
          return;
        }

        const evolutionCount =
          Array.isArray(report.evolutionHistory)
            ? report.evolutionHistory.length
            : 0;

        alert(
          "ALPHA V8\n\n" +
          "Cycles : " +
          report.actualState.cycles + "\n" +

          "Souvenirs : " +
          report.actualState.memories + "\n" +

          "Recherches : " +
          report.actualState.searches + "\n" +

          "Évolutions : " +
          evolutionCount
        );
      }
    );

    document.body.appendChild(button);
  }

  function bootCleanInterface() {

    cleanDiagnosticPanel();

    // Vérifie encore après l'initialisation d'Alpha
    setTimeout(
      cleanDiagnosticPanel,
      300
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      bootCleanInterface
    );

  } else {

    bootCleanInterface();

  }

})();
/* ============================================================
   ALPHA V9 — HOTFIX COMMUNICATION
   Répare le bouton ÉCHANGER
   Supprime le panneau diagnostic
   ============================================================ */

(() => {
  "use strict";

  function bootV9() {

    const V8 = window.ALPHA_V8;

    const oldSend =
      document.getElementById("send");

    const oldQuestion =
      document.getElementById("question");

    if (!V8 || !oldSend || !oldQuestion) {
      console.warn(
        "[ALPHA V9] Interface introuvable."
      );
      return;
    }

    /* --------------------------------------------------------
       SUPPRESSION DU PANNEAU
       -------------------------------------------------------- */

    const panel =
      document.getElementById("alpha-v8-panel");

    if (panel) {
      panel.remove();
    }

    /* Supprime l'ancien petit bouton V8 */
    const oldDiagnostic =
      document.getElementById("alpha-v8-button");

    if (oldDiagnostic) {
      oldDiagnostic.remove();
    }

    /* --------------------------------------------------------
       NOUVEAUX ÉLÉMENTS
       -------------------------------------------------------- */

    const send =
      oldSend.cloneNode(true);

    oldSend.replaceWith(send);

    const question =
      oldQuestion.cloneNode(true);

    oldQuestion.replaceWith(question);

    /* --------------------------------------------------------
       FONCTION DE COMMUNICATION
       -------------------------------------------------------- */

    async function askAlpha() {

      const q =
        String(question.value || "").trim();

      if (!q) return;

      question.value = "";

      setStatus("● ANALYSE V8");

      try {

        const result =
          await V8.processQuestion(q);

        let response = "";

        /* Recherche externe */

        if (
          result.research &&
          result.research.length
        ) {

          response = [
            "J'ai analysé ta question et déterminé qu'une recherche externe était nécessaire.",
            "",
            ...result.research
              .slice(0, 3)
              .map(r =>
                `• ${r.title}\n` +
                `${String(
                  r.extract ||
                  r.text ||
                  ""
                ).slice(0, 1400)}\n` +
                `Source : ${
                  r.url ||
                  "source externe"
                }`
              )
          ].join("\n\n");

        }

        /* Mémoire */

        else if (
          result.route &&
          result.route.memoryResults &&
          result.route.memoryResults.length
        ) {

          response = [
            "J'ai analysé la question avant d'utiliser ma mémoire.",
            "",
            ...result.route.memoryResults
              .slice(0, 3)
              .map(r =>
                `• ${
                  r.memory?.text ||
                  r.text ||
                  "information mémorisée"
                }`
              )
          ].join("\n\n");

        }

        /* Pas de résultat */

        else {

          response = [
            "J'ai analysé ta question.",
            "",
            "Je ne dispose pas encore de suffisamment d'informations fiables pour produire une réponse correcte.",
            "",
            "Je peux poursuivre par une recherche si tu me demandes de chercher."
          ].join("\n");

        }

        /* ----------------------------------------------------
           ENREGISTREMENT DE LA CONVERSATION
           ---------------------------------------------------- */

        if (
          typeof S !== "undefined" &&
          Array.isArray(S.conversation)
        ) {

          S.conversation.push(
            {
              role: "human",
              text: q,
              at: new Date().toISOString()
            },
            {
              role: "alpha",
              text: response,
              at: new Date().toISOString()
            }
          );

          S.conversation =
            S.conversation.slice(-100);

          if (
            typeof save === "function"
          ) {
            save();
          }
        }

        /* ----------------------------------------------------
           AFFICHAGE
           ---------------------------------------------------- */

        if (
          typeof render === "function"
        ) {
          render();
        }

        setStatus("● EN LIGNE");

      } catch (error) {

        console.error(
          "[ALPHA V9] Erreur :",
          error
        );

        setStatus(
          "● ERREUR — RÉESSAYE"
        );
      }
    }

    /* --------------------------------------------------------
       BOUTON ÉCHANGER
       -------------------------------------------------------- */

    send.addEventListener(
      "click",
      askAlpha
    );

    /* --------------------------------------------------------
       TOUCHE ENTRÉE
       -------------------------------------------------------- */

    question.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          askAlpha();
        }

      }
    );

    /* --------------------------------------------------------
       PETIT BOUTON DIAGNOSTIC
       -------------------------------------------------------- */

    const diagnostic =
      document.createElement("button");

    diagnostic.id =
      "alpha-v9-diagnostic";

    diagnostic.type =
      "button";

    diagnostic.textContent =
      "V8";

    diagnostic.title =
      "État interne d'Alpha";

    diagnostic.style.cssText = `
      position:fixed;
      right:12px;
      bottom:12px;
      z-index:9999;

      width:42px;
      height:34px;

      border:1px solid #444;
      border-radius:10px;

      background:#111;
      color:#fff;

      font:700 11px Arial,sans-serif;

      opacity:.45;
    `;

    diagnostic.addEventListener(
      "click",
      () => {

        const report =
          V8.selfReport();

        alert(
          "ALPHA V8\n\n" +

          "Cycles : " +
          report.actualState.cycles +

          "\nSouvenirs : " +
          report.actualState.memories +

          "\nRecherches : " +
          report.actualState.searches +

          "\nÉvolutions : " +
          report.evolutionHistory.length
        );
      }
    );

    document.body.appendChild(
      diagnostic
    );

    console.log(
      "[ALPHA V9] Communication réparée."
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      bootV9
    );

  } else {

    bootV9();

  }

})();
/* ============================================================
   ALPHA V9 — ROUTEUR CONVERSATIONNEL
   Correction du raisonnement conversationnel V8

   Objectifs :
   - comprendre les formulations naturelles
   - ne pas confondre une question avec un souvenir
   - privilégier l'identité / l'état / les capacités
   - conserver V8 pour la recherche et l'évolution
   ============================================================ */

(() => {
  "use strict";

  function normalizeV9(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ----------------------------------------------------------
     INTENTION : IDENTITÉ
     ---------------------------------------------------------- */

  function isIdentityV9(q) {

    const t = normalizeV9(q);

    return [
      "qui es tu",
      "qui est tu",
      "tu es quoi",
      "t es quoi",
      "c est quoi ton nom",
      "quel est ton nom",
      "comment tu t appelles",
      "tu t appelles comment",
      "presente toi",
      "parle moi de toi",
      "qui es tu alpha",
      "c est quoi alpha",
      "alpha c est quoi",
      "je veux savoir qui tu es",
      "je veux savoir ce que tu es"
    ].some(pattern => t === pattern || t.includes(pattern));
  }

  /* ----------------------------------------------------------
     INTENTION : ÉTAT
     ---------------------------------------------------------- */

  function isStateV9(q) {

    const t = normalizeV9(q);

    return [
      "comment vas tu",
      "comment tu vas",
      "quel est ton etat",
      "ton etat actuel",
      "ou en es tu",
      "ou en es tu actuellement",
      "sur quoi travailles tu",
      "que fais tu actuellement",
      "qu est ce que tu fais actuellement"
    ].some(pattern => t === pattern || t.includes(pattern));
  }

  /* ----------------------------------------------------------
     INTENTION : CAPACITÉS
     ---------------------------------------------------------- */

  function isCapabilitiesV9(q) {

    const t = normalizeV9(q);

    return [
      "que sais tu faire",
      "tu sais faire quoi",
      "tu peux faire quoi",
      "qu est ce que tu peux faire",
      "quelles sont tes capacites",
      "tes capacites",
      "de quoi es tu capable",
      "tu es capable de quoi"
    ].some(pattern => t === pattern || t.includes(pattern));
  }

  /* ----------------------------------------------------------
     INTENTION : LIMITES
     ---------------------------------------------------------- */

  function isLimitsV9(q) {

    const t = normalizeV9(q);

    return [
      "quelles sont tes limites",
      "tes limites",
      "tu ne peux pas faire quoi",
      "qu est ce que tu ne peux pas faire",
      "qu est ce que tu ne sais pas faire",
      "qu est ce que tu ignores"
    ].some(pattern => t === pattern || t.includes(pattern));
  }

  /* ----------------------------------------------------------
     IDENTITÉ
     ---------------------------------------------------------- */

  function identityResponse() {

    const report =
      window.ALPHA_V8 &&
      typeof window.ALPHA_V8.selfReport === "function"
        ? window.ALPHA_V8.selfReport()
        : null;

    if (!report) {

      return [
        "Je suis ALPHA.",
        "",
        "Je suis un programme JavaScript exécuté dans un navigateur.",
        "",
        "Mon architecture actuelle comprend une mémoire persistante,",
        "un système de recherche, une auto-observation et un mécanisme",
        "d'évolution de stratégies."
      ].join("\n");
    }

    return [
      "Je suis ALPHA.",
      "",
      "Je suis un programme JavaScript exécuté dans un navigateur.",
      "",
      "Mon moteur actuel est ALPHA V8.",
      "",
      "Je peux :",
      "• observer mon état interne",
      "• mémoriser des informations",
      "• rechercher des informations externes",
      "• comparer des stratégies",
      "• tester certaines évolutions",
      "• conserver des stratégies validées",
      "",
      `État mesuré :`,
      `• ${report.actualState.cycles} cycle(s)`,
      `• ${report.actualState.memories} souvenir(s)`,
      `• ${report.actualState.searches} recherche(s)`,
      `• ${report.evolutionHistory.length} évolution(s) enregistrée(s)`,
      "",
      "Je peux décrire mon fonctionnement à partir de ce que mon programme peut réellement observer.",
      "",
      "Cela ne constitue pas une preuve de conscience subjective."
    ].join("\n");
  }

  /* ----------------------------------------------------------
     ÉTAT
     ---------------------------------------------------------- */

  function stateResponse() {

    if (
      !window.ALPHA_V8 ||
      typeof window.ALPHA_V8.selfReport !== "function"
    ) {
      return "Je ne peux pas encore mesurer précisément mon état interne.";
    }

    const r =
      window.ALPHA_V8.selfReport();

    return [
      "Voici mon état actuellement mesuré :",
      "",
      `Version : ${r.version}`,
      `Cycles : ${r.actualState.cycles}`,
      `Souvenirs : ${r.actualState.memories}`,
      `Recherches : ${r.actualState.searches}`,
      `Évolutions enregistrées : ${r.evolutionHistory.length}`,
      "",
      "Mon fonctionnement suit actuellement cette logique :",
      "",
      "observer → analyser → rechercher si nécessaire → tester → conserver ou rejeter."
    ].join("\n");
  }

  /* ----------------------------------------------------------
     CAPACITÉS
     ---------------------------------------------------------- */

  function capabilitiesResponse() {

    if (
      !window.ALPHA_V8 ||
      typeof window.ALPHA_V8.selfReport !== "function"
    ) {
      return "Je peux dialoguer, mémoriser et effectuer certaines recherches.";
    }

    const r =
      window.ALPHA_V8.selfReport();

    return [
      "J'ai vérifié mes capacités observables.",
      "",
      "Je peux :",
      ...r.actualCapabilities.map(
        capability => `• ${capability}`
      ),
      "",
      `Mesures actuelles : ${r.actualState.cycles} cycle(s), ${r.actualState.memories} souvenir(s), ${r.actualState.searches} recherche(s).`,
      "",
      "Je distingue ces capacités réelles de celles que je pourrais seulement proposer comme évolution future."
    ].join("\n");
  }

  /* ----------------------------------------------------------
     LIMITES
     ---------------------------------------------------------- */

  function limitsResponse() {

    if (
      !window.ALPHA_V8 ||
      typeof window.ALPHA_V8.selfReport !== "function"
    ) {
      return "Je ne peux pas encore déterminer toutes mes limites.";
    }

    const r =
      window.ALPHA_V8.selfReport();

    return [
      "Après auto-observation, voici mes principales limites :",
      "",
      ...r.importantLimitations.map(
        limitation => `• ${limitation}`
      ),
      "",
      "Je ne dois pas prétendre avoir réalisé une modification ou une capacité qui n'est pas réellement présente dans mon programme."
    ].join("\n");
  }

  /* ----------------------------------------------------------
     CONVERSATION
     ---------------------------------------------------------- */

  function saveConversation(question, response) {

    try {

      if (
        typeof S !== "undefined" &&
        Array.isArray(S.conversation)
      ) {

        S.conversation.push(
          {
            role: "human",
            text: question,
            at: new Date().toISOString()
          },
          {
            role: "alpha",
            text: response,
            at: new Date().toISOString()
          }
        );

        S.conversation =
          S.conversation.slice(-100);

        if (typeof save === "function") {
          save();
        }

        if (typeof render === "function") {
          render();
        }
      }

    } catch (error) {

      console.warn(
        "[ALPHA V9] Sauvegarde conversation impossible",
        error
      );

    }
  }

  /* ----------------------------------------------------------
     NOUVELLE FONCTION PRINCIPALE
     ---------------------------------------------------------- */

  async function answerV9(question) {

    const q =
      String(question || "").trim();

    if (!q) return;

    if (typeof setStatus === "function") {
      setStatus("● ANALYSE V9");
    }

    let response;

    /* PRIORITÉ 1 : IDENTITÉ */

    if (isIdentityV9(q)) {

      response =
        identityResponse();

    }

    /* PRIORITÉ 2 : ÉTAT */

    else if (isStateV9(q)) {

      response =
        stateResponse();

    }

    /* PRIORITÉ 3 : CAPACITÉS */

    else if (isCapabilitiesV9(q)) {

      response =
        capabilitiesResponse();

    }

    /* PRIORITÉ 4 : LIMITES */

    else if (isLimitsV9(q)) {

      response =
        limitsResponse();

    }

    /* --------------------------------------------------------
       QUESTION NORMALE
       V8 RESTE UTILISÉ
       -------------------------------------------------------- */

    else {

      try {

        if (
          window.ALPHA_V8 &&
          typeof window.ALPHA_V8.processQuestion === "function"
        ) {

          const result =
            await window.ALPHA_V8.processQuestion(q);

          if (
            result.research &&
            result.research.length
          ) {

            response = [
              "J'ai analysé la question.",
              "",
              "J'ai choisi d'effectuer une recherche externe.",
              "",
              ...result.research
                .slice(0, 3)
                .map(r =>
                  `• ${r.title}\n` +
                  `${String(
                    r.extract ||
                    r.text ||
                    ""
                  ).slice(0, 1500)}\n` +
                  `Source : ${
                    r.url ||
                    "source externe"
                  }`
                )
            ].join("\n\n");

          }

          else {

            response = [
              "J'ai analysé ta question.",
              "",
              "Je n'ai pas trouvé suffisamment d'informations fiables dans ma mémoire.",
              "",
              "Je peux effectuer une recherche externe si nécessaire."
            ].join("\n");

          }

        }

        else {

          response =
            "Mon moteur V8 n'est pas accessible actuellement.";

        }

      } catch (error) {

        console.error(
          "[ALPHA V9]",
          error
        );

        response =
          "Une erreur est survenue pendant mon analyse.";
      }
    }

    saveConversation(
      q,
      response
    );

    if (typeof setStatus === "function") {
      setStatus("● EN LIGNE");
    }
  }

  /* ----------------------------------------------------------
     REMPLACEMENT DU BOUTON
     ---------------------------------------------------------- */

  function installV9() {

    const button =
      document.getElementById("send");

    const input =
      document.getElementById("question");

    if (!button || !input) {

      setTimeout(
        installV9,
        300
      );

      return;
    }

    /* clone = suppression de TOUS les anciens listeners */

    const newButton =
      button.cloneNode(true);

    button.replaceWith(
      newButton
    );

    const newInput =
      input.cloneNode(true);

    input.replaceWith(
      newInput
    );

    newButton.addEventListener(
      "click",
      () => {

        answerV9(
          newInput.value
        );

        newInput.value = "";
      }
    );

    newInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          answerV9(
            newInput.value
          );

          newInput.value = "";
        }
      }
    );

    console.log(
      "[ALPHA V9] Routage conversationnel actif."
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      installV9
    );

  } else {

    installV9();

  }

})();
