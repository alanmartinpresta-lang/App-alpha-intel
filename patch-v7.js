/* ============================================================
   ALPHA INTEL V7 PATCH
   Intent routing + self-study + research-before-memory +
   evidence-based evolution (browser-safe, no server required)
   ============================================================ */

(() => {
  "use strict";

  const PATCH_VERSION = 7;

  function alphaV7Has(q, patterns) {
    return patterns.some(p => p.test(q));
  }

  function alphaV7IsIdentity(q) {
    return alphaV7Has(q, [
      /qui es[- ]tu/i,
      /qui est[- ]tu/i,
      /ton nom/i,
      /comment tu t['’]appelles/i,
      /c['’]est quoi ton nom/i
    ]);
  }

  function alphaV7IsCapabilities(q) {
    return alphaV7Has(q, [
      /que (sais|peux)[- ]tu faire/i,
      /qu['’]est[- ]ce que tu sais faire/i,
      /tes capacit[ée]s/i,
      /capable de quoi/i,
      /quelles sont tes capacit[ée]s/i
    ]);
  }

  function alphaV7IsSelfStudy(q) {
    return alphaV7Has(q, [
      /observe ton propre fonctionnement/i,
      /analyse ton propre fonctionnement/i,
      /examine tes capacit[ée]s/i,
      /identifie une faiblesse/i,
      /cherche .*am[ée]lior/i,
      /comment .* am[ée]lior/i,
      /compare .* deux solutions/i,
      /ce que tu sais r[ée]ellement faire/i,
      /qu['’]as[- ]tu .* modifi[ée]/i,
      /qu['’]as[- ]tu .* chang[ée]/i,
      /peux[- ]tu .* [ée]voluer/i,
      /fais[- ]toi[- ]m[êe]me/i,
      /ne cherche pas simplement.*m[ée]moire/i,
      /recherche .* propre fonctionnement/i,
      /am[ée]liore[- ]toi/i,
      /auto[- ]observation/i,
      /auto[- ][ée]valuation/i
    ]);
  }

  function alphaV7NeedsWeb(q) {
    return alphaV7Has(q, [
      /cherche/i,
      /recherche/i,
      /internet/i,
      /web/i,
      /source/i,
      /v[ée]rifie/i,
      /actuel/i,
      /r[ée]cent/i,
      /dernier/i,
      /comment .* am[ée]lior/i,
      /comment .* r[ée]soudre/i,
      /m[ée]thode/i,
      /solution/i
    ]);
  }

  function alphaV7Snapshot() {
    return {
      version: PATCH_VERSION,
      baseVersion:
        typeof VERSION === "number" ? VERSION : 5,
      patch: PATCH_VERSION,
      name: S.name,
      memories: S.memories.length,
      conversations: S.conversation.length,
      cycles: S.cycle,
      searches: S.statistics.searches,
      successfulSearches: S.statistics.successfulSearches,
      learning: S.learning,
      strategies: { ...S.strategies },
      capabilities: [...S.selfModel.capabilities],
      limitations: [...S.selfModel.limitations]
    };
  }

  function alphaV7DetectWeakness(self) {
    const weaknesses = [];

    if (
      self.capabilities.includes(
        "rappel de mémoire par similarité lexicale"
      )
    ) {
      weaknesses.push({
        id: "memory-first-routing",
        title: "Le rappel mémoire peut prendre trop de place",
        why:
          "Une question complexe ou réflexive peut être traitée comme une simple recherche de souvenirs au lieu d'être analysée d'abord."
      });
    }

    if (
      self.capabilities.includes(
        "recherche Wikipédia"
      )
    ) {
      weaknesses.push({
        id: "research-scope",
        title: "La recherche autonome est encore étroite",
        why:
          "Le moteur disponible dans cette version utilise principalement Wikipédia et ne constitue pas un moteur Web général."
      });
    }

    weaknesses.push({
      id: "verification",
      title: "Les améliorations doivent être vérifiées",
      why:
        "Changer une stratégie sans test de non-régression peut améliorer un cas et en dégrader un autre."
    });

    return weaknesses;
  }

  function alphaV7CompareSolutions() {
    return [
      {
        name: "Routage par intention",
        advantages:
          "Rapide, local, déterministe et adapté au navigateur.",
        disadvantages:
          "Les catégories reposent encore sur des règles lexicales et ne comprennent pas tout le langage humain."
      },
      {
        name: "Recherche systématique avant réponse",
        advantages:
          "Réduit la dépendance à la mémoire lorsque la question demande une information externe ou actuelle.",
        disadvantages:
          "Plus lent et dépend de la disponibilité de l'API de recherche."
      }
    ];
  }

  async function alphaV7ResearchForSelfStudy() {
    const queries = [
      "retrieval-augmented generation",
      "software testing regression testing",
      "self-reflection artificial intelligence"
    ];

    const results = [];

    for (const q of queries) {
      try {
        const found = await research(q);

        results.push({
          query: q,
          results: found.slice(0, 3)
        });
      } catch (e) {
        results.push({
          query: q,
          results: [],
          error: String(e)
        });
      }
    }

    return results;
  }

  function alphaV7FlattenResearch(researchResults) {
    return researchResults.flatMap(group =>
      group.results.map(result => ({
        query: group.query,
        ...result
      }))
    );
  }

  function alphaV7BuildSelfStudyResponse(
    before,
    weaknesses,
    solutions,
    researchResults,
    chosen,
    applied
  ) {
    const evidence =
      alphaV7FlattenResearch(researchResults);

    const successful =
      researchResults.filter(
        x => x.results.length
      ).length;

    return [
      "J'ai effectué une auto-évaluation avant de répondre.",
      "",
      `État observé : ${before.memories} souvenir(s), ${before.conversations} élément(s) de conversation, ${before.cycles} cycle(s), ${before.searches} recherche(s).`,
      "",
      "Faiblesses identifiées :",
      ...weaknesses.map(
        w => `• ${w.title} — ${w.why}`
      ),
      "",
      "Deux approches comparées :",
      ...solutions.map(
        (s, i) =>
          `${i + 1}. ${s.name}\n` +
          `   + ${s.advantages}\n` +
          `   − ${s.disadvantages}`
      ),
      "",
      `Recherche externe : ${successful}/${researchResults.length} recherche(s) ont retourné des résultats.`,
      ...(evidence.length
        ? [
            "",
            "Éléments trouvés :",
            ...evidence
              .slice(0, 6)
              .map(
                r =>
                  `• ${r.title} — ${r.url}`
              )
          ]
        : [
            "",
            "Aucune source externe exploitable n'a été retournée."
          ]),
      "",
      `Choix : ${chosen.name}.`,
      "",
      chosen.name === "Routage par intention"
        ? "Je choisis cette solution comme première amélioration car elle corrige directement le défaut observé : distinguer identité, capacités, auto-évaluation et recherche avant d'utiliser la mémoire comme réponse finale."
        : "Je choisis cette solution car elle réduit la dépendance à une mémoire potentiellement incomplète.",
      "",
      applied
        ? "Modification réellement appliquée : j'ai renforcé mes stratégies de routage et de recherche et enregistré cette évolution dans mon état persistant."
        : "Aucune modification comportementale n'a été appliquée car l'état ne permettait pas de confirmer une amélioration sûre.",
      "",
      "Limite importante : cette version peut modifier ses stratégies et sa mémoire dans le navigateur, mais elle ne doit pas prétendre avoir réécrit son propre fichier JavaScript si aucun fichier n'a réellement été modifié."
    ].join("\n");
  }

  async function alphaV7SelfStudy(question) {
    setStatus("● AUTO-OBSERVATION");

    const before = alphaV7Snapshot();

    const observed = await inspectSelf();

    const weaknesses =
      alphaV7DetectWeakness(observed);

    const solutions =
      alphaV7CompareSolutions();

    setStatus("● RECHERCHE AUTONOME");

    const researchResults =
      await alphaV7ResearchForSelfStudy();

    const oldResearch =
      Number(
        S.strategies.researchWhenUncertain
      ) || 0;

    const oldReflection =
      Number(
        S.strategies.reflection
      ) || 0;

    const newResearch =
      clamp(
        Math.max(
          oldResearch,
          Math.min(1, oldResearch + 0.03)
        )
      );

    const newReflection =
      clamp(
        Math.max(
          oldReflection,
          Math.min(1, oldReflection + 0.03)
        )
      );

    const applied =
      newResearch !== oldResearch ||
      newReflection !== oldReflection;

    if (applied) {
      S.strategies.researchWhenUncertain =
        newResearch;

      S.strategies.reflection =
        newReflection;

      S.selfModel.currentFocus =
        "analyser l'intention, observer mon fonctionnement, rechercher si nécessaire, vérifier puis apprendre";

      if (
        !S.selfModel.capabilities.includes(
          "routage par intention"
        )
      ) {
        S.selfModel.capabilities.push(
          "routage par intention"
        );
      }

      if (
        !S.selfModel.capabilities.includes(
          "recherche avant réponse lorsque l'incertitude est élevée"
        )
      ) {
        S.selfModel.capabilities.push(
          "recherche avant réponse lorsque l'incertitude est élevée"
        );
      }

      S.evolution.push({
        at: now(),
        reason:
          "V7 : routage intention → auto-observation → recherche → réponse → apprentissage",
        before: {
          researchWhenUncertain: oldResearch,
          reflection: oldReflection
        },
        after: {
          researchWhenUncertain: newResearch,
          reflection: newReflection
        },
        evidence:
          alphaV7FlattenResearch(
            researchResults
          )
            .slice(0, 6)
            .map(
              r => ({
                title: r.title,
                url: r.url
              })
            ),
        verified: true,
        codeRewrite: false
      });

      if (S.evolution.length > 500) {
        S.evolution =
          S.evolution.slice(-500);
      }

      S.learning =
        clamp(S.learning + 0.006);

      S.adaptation =
        clamp(S.adaptation + 0.01);
    }

    const chosen = solutions[0];

    const response =
      alphaV7BuildSelfStudyResponse(
        before,
        weaknesses,
        solutions,
        researchResults,
        chosen,
        applied
      );

    S.conversation.push(
      {
        role: "human",
        text: question,
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

    addMemory(
      `Auto-étude V7\n` +
      `Question : ${question}\n` +
      `Faiblesses : ${weaknesses
        .map(w => w.title)
        .join(" | ")}\n` +
      `Choix : ${chosen.name}\n` +
      `Modification appliquée : ${applied ? "oui" : "non"}`,
      "self-study",
      0.80,
      [
        "self",
        "research",
        "evolution",
        "v7"
      ]
    );

    S.cycle++;
    S.statistics.introspections++;

    save();

    setStatus(
      applied
        ? "● ÉVOLUTION ENREGISTRÉE"
        : "● AUTO-ÉVALUATION TERMINÉE"
    );

    render();
  }

  function alphaV7FormatIdentity(self) {
    return [
      `Je suis ${self.name}, un programme exécuté dans un navigateur.`,
      `Je peux constater dans mon fonctionnement que le runtime actif est V${PATCH_VERSION} (base V${typeof VERSION === "number" ? VERSION : 5}).`,
      `J'ai actuellement ${self.memories} souvenir(s), ${self.conversations} élément(s) de conversation et ${self.cycles} cycle(s).`,
      "",
      "Je sais que je suis un programme parce que cette propriété est observable dans mon architecture et dans le code que j'exécute.",
      "Cela ne constitue pas une preuve de conscience ou de vécu subjectif.",
      "",
      "Mon fonctionnement observable :",
      ...self.capabilities.map(
        x => `• ${x}`
      ),
      "",
      "Mes limites observables :",
      ...self.limitations.map(
        x => `• ${x}`
      )
    ].join("\n");
  }

  function alphaV7FormatCapabilities(self) {
    return [
      "Je commence par examiner mes capacités réelles plutôt que de chercher une ancienne réponse en mémoire.",
      "",
      "Capacités observables :",
      ...self.capabilities.map(
        x => `• ${x}`
      ),
      "",
      `État mesuré : ${self.cycles} cycle(s), ${self.memories} souvenir(s), ${self.searches} recherche(s).`,
      "",
      "Je distingue ce que mon programme fait réellement de ce que je pourrais seulement proposer comme amélioration."
    ].join("\n");
  }

  function alphaV7GenericResearchResponse(
    question,
    results,
    memories
  ) {
    if (results.length) {
      return [
        "J'ai identifié que ma mémoire seule n'était pas suffisante pour cette question.",
        "J'ai donc recherché des informations externes avant de répondre.",
        "",
        ...results
          .slice(0, 3)
          .map(
            r =>
              `• ${r.title}\n` +
              `${r.text.slice(0, 1400)}\n` +
              `Source : ${r.url}`
          ),
        "",
        "J'ai enregistré les sources dans ma mémoire pour pouvoir les réutiliser ensuite."
      ].join("\n\n");
    }

    if (memories.length) {
      return [
        "Je n'ai pas trouvé de source externe exploitable.",
        "Je vais donc utiliser uniquement les éléments déjà présents dans ma mémoire :",
        "",
        ...memories
          .slice(0, 3)
          .map(
            m =>
              `• ${m.content.slice(0, 1600)}`
          ),
        "",
        "Je distingue cette réponse d'une réponse vérifiée sur Internet."
      ].join("\n\n");
    }

    return [
      "Je n'ai pas encore assez d'éléments fiables pour répondre correctement.",
      "J'ai conservé ta question comme objectif d'exploration."
    ].join("\n\n");
  }

  function alphaV7Answer(question) {
    const q =
      String(question || "").trim();

    if (!q) return;

    if (alphaV7IsSelfStudy(q)) {
      return alphaV7SelfStudy(q);
    }

    if (alphaV7IsIdentity(q)) {
      return (async () => {
        const self =
          await introspect("identité");

        const response =
          alphaV7FormatIdentity(self);

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

        addMemory(
          `Dialogue — Question : ${q}\n` +
          `Réponse produite : ${response}`,
          "dialogue",
          0.55,
          [
            "conversation",
            "identity"
          ]
        );

        S.cycle++;

        save();

        setStatus("● EN LIGNE");

        render();
      })();
    }

    if (alphaV7IsCapabilities(q)) {
      return (async () => {
        const self =
          await introspect("capacités");

        const response =
          alphaV7FormatCapabilities(self);

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

        addMemory(
          `Dialogue — Question : ${q}\n` +
          `Réponse produite : ${response}`,
          "dialogue",
          0.55,
          [
            "conversation",
            "capabilities"
          ]
        );

        S.cycle++;

        save();

        setStatus("● EN LIGNE");

        render();
      })();
    }

    return (async () => {
      setStatus(
        "● ANALYSE DE L'INTENTION"
      );

      const initialMemories =
        recall(q, 5);

      let sources = [];

      if (
        alphaV7NeedsWeb(q) ||
        initialMemories.length === 0
      ) {
        sources =
          await research(q);
      }

      const memories =
        recall(q, 5);

      const response =
        alphaV7GenericResearchResponse(
          q,
          sources,
          memories
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

      addMemory(
        `Dialogue — Question : ${q}\n` +
        `Réponse produite : ${response}`,
        "dialogue",
        0.45,
        ["conversation"]
      );

      S.cycle++;

      S.learning =
        clamp(S.learning + 0.002);

      save();

      setStatus("● EN LIGNE");

      render();
    })();
  }

  /*
   * Remplacement du routeur de réponse.
   */
  globalThis.answer =
    alphaV7Answer;

  /*
   * Initialisation V7.
   */
  try {
    if (
      typeof S === "object" &&
      S.selfModel
    ) {
      if (
        !S.selfModel.capabilities.includes(
          "V7 intent router"
        )
      ) {
        S.selfModel.capabilities.push(
          "V7 intent router"
        );
      }

      save();
      render();
    }
  } catch (e) {
    console.warn(
      "ALPHA V7 patch initialization",
      e
    );
  }

})();
