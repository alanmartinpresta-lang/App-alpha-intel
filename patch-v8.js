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
