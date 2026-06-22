(function () {
  const { useState } = React;

  const LEVELS = {
    debutant: { label: "Debutant", rounds: 4, startLength: 2, speed: 900 },
    intermediaire: { label: "Inter.", fullLabel: "Intermediaire", rounds: 6, startLength: 3, speed: 720 },
    avance: { label: "Avance", rounds: 8, startLength: 4, speed: 560 },
  };

  const THEMES = {
    aurore: {
      label: "Aurore",
      cue: "Rythme doux",
      className: "theme-aurora",
      items: [
        { id: "sun", label: "Soleil", symbol: "circle" },
        { id: "drop", label: "Goutte", symbol: "drop" },
        { id: "spark", label: "Etincelle", symbol: "spark" },
        { id: "wave", label: "Vague", symbol: "wave" },
      ],
    },
    atelier: {
      label: "Atelier",
      cue: "Contraste net",
      className: "theme-studio",
      items: [
        { id: "grid", label: "Grille", symbol: "grid" },
        { id: "bolt", label: "Eclair", symbol: "bolt" },
        { id: "ring", label: "Anneau", symbol: "ring" },
        { id: "line", label: "Ligne", symbol: "line" },
      ],
    },
  };

  const h = React.createElement;

  function randomTile(themeKey) {
    const ids = THEMES[themeKey].items.map((item) => item.id);
    return ids[Math.floor(Math.random() * ids.length)];
  }

  function makeSequence(length, themeKey) {
    return Array.from({ length }, () => randomTile(themeKey));
  }

  function Icon({ symbol }) {
    const common = { viewBox: "0 0 80 80", "aria-hidden": true };
    const shapes = {
      circle: h("svg", common, h("circle", { cx: 40, cy: 40, r: 22 })),
      drop: h("svg", common, h("path", { d: "M40 10 C56 28 64 42 64 53 C64 67 53 76 40 76 C27 76 16 67 16 53 C16 42 24 28 40 10 Z" })),
      spark: h("svg", common, h("path", { d: "M40 6 L49 31 L74 40 L49 49 L40 74 L31 49 L6 40 L31 31 Z" })),
      wave: h("svg", common, h("path", { d: "M10 48 C22 24 36 24 48 48 C56 64 64 64 72 48" })),
      grid: h("svg", common, h("path", { d: "M18 18 H62 V62 H18 Z M40 18 V62 M18 40 H62" })),
      bolt: h("svg", common, h("path", { d: "M46 6 L18 44 H38 L31 74 L62 34 H42 Z" })),
      ring: h("svg", common, h("circle", { cx: 40, cy: 40, r: 26 }), h("circle", { cx: 40, cy: 40, r: 12 })),
      line: h("svg", common, h("path", { d: "M14 55 L30 25 L46 55 L62 25" })),
    };
    return shapes[symbol];
  }

  function App() {
    const [level, setLevel] = useState("debutant");
    const [theme, setTheme] = useState("aurore");
    const [screen, setScreen] = useState("setup");
    const [round, setRound] = useState(1);
    const [sequence, setSequence] = useState([]);
    const [step, setStep] = useState(0);
    const [activeCue, setActiveCue] = useState(null);
    const [message, setMessage] = useState("Choisissez un niveau et lancez la premiere manche.");
    const [mistakes, setMistakes] = useState(0);
    const [score, setScore] = useState(0);
    const [isShowing, setIsShowing] = useState(false);

    const selectedLevel = LEVELS[level];
    const selectedTheme = THEMES[theme];
    const currentLength = selectedLevel.startLength + round - 1;
    const progress = Math.round(((round - 1) / selectedLevel.rounds) * 100);

    function showSequence(nextSequence) {
      setIsShowing(true);
      setStep(0);
      setMessage("Regardez bien l'ordre des tuiles.");
      nextSequence.forEach((itemId, index) => {
        window.setTimeout(() => setActiveCue(itemId), index * selectedLevel.speed);
        window.setTimeout(() => setActiveCue(null), index * selectedLevel.speed + selectedLevel.speed * 0.58);
      });
      window.setTimeout(() => {
        setIsShowing(false);
        setMessage("A vous: touchez les tuiles dans le meme ordre.");
      }, nextSequence.length * selectedLevel.speed + 120);
    }

    function startGame() {
      const firstSequence = makeSequence(selectedLevel.startLength, theme);
      setRound(1);
      setMistakes(0);
      setScore(0);
      setSequence(firstSequence);
      setScreen("game");
      window.setTimeout(() => showSequence(firstSequence), 250);
    }

    function repeatSequence() {
      if (!isShowing) showSequence(sequence);
    }

    function handleChoice(itemId) {
      if (screen !== "game" || isShowing) return;
      setActiveCue(itemId);
      window.setTimeout(() => setActiveCue(null), 260);

      const expected = sequence[step];
      if (itemId !== expected) {
        setMistakes((value) => value + 1);
        setMessage("Pas grave. Reprenez depuis la premiere tuile.");
        setStep(0);
        window.setTimeout(() => showSequence(sequence), 900);
        return;
      }

      const nextStep = step + 1;
      setStep(nextStep);
      setScore((value) => value + 10);

      if (nextStep === sequence.length) {
        if (round === selectedLevel.rounds) {
          setScreen("summary");
          setMessage("Partie terminee.");
          return;
        }
        const nextRound = round + 1;
        const nextSequence = [...sequence, randomTile(theme)];
        setRound(nextRound);
        setSequence(nextSequence);
        setMessage("Bien joue. La prochaine manche sera un peu plus longue.");
        window.setTimeout(() => showSequence(nextSequence), 1100);
      } else {
        setMessage(`${nextStep}/${sequence.length}. Continuez.`);
      }
    }

    function setupScreen() {
      return h(
        "main",
        { className: `app-shell ${selectedTheme.className}` },
        h("section", { className: "hero-panel" },
          h("div", { className: "brand-block" },
            h("p", { className: "eyebrow" }, "Jeu de sequences"),
            h("h1", null, "MemoRythme"),
            h("p", { className: "lead" }, "Memorisez les tuiles qui s'allument, puis touchez-les dans le meme ordre.")
          ),
          h("div", { className: "preview-board", "aria-hidden": true },
            selectedTheme.items.map((item, index) =>
              h("div", { className: `preview-tile color-${index}`, key: item.id }, h(Icon, { symbol: item.symbol }))
            )
          )
        ),
        h("section", { className: "config-grid", "aria-label": "Configuration du jeu" },
          h("div", { className: "control-panel" },
            h("h2", null, "Niveau"),
            h("div", { className: "segmented" },
              Object.entries(LEVELS).map(([key, value]) =>
                h("button", {
                  key,
                  className: key === level ? "selected" : "",
                  onClick: () => setLevel(key),
                  type: "button",
                }, value.label)
              )
            ),
            h("p", null, `${selectedLevel.rounds} manches. La sequence grandit de ${selectedLevel.startLength} a ${selectedLevel.startLength + selectedLevel.rounds - 1} tuiles.`)
          ),
          h("div", { className: "control-panel" },
            h("h2", null, "Theme"),
            h("div", { className: "theme-options" },
              Object.entries(THEMES).map(([key, value]) =>
                h("button", {
                  key,
                  className: `theme-choice ${key === theme ? "selected" : ""}`,
                  onClick: () => setTheme(key),
                  type: "button",
                },
                h("span", { className: `swatch ${value.className}` }),
                h("span", null, value.label),
                h("small", null, value.cue))
              )
            )
          )
        ),
        h("div", { className: "action-row" }, h("button", { className: "primary-action", onClick: startGame, type: "button" }, "Commencer")),
        h(Footer)
      );
    }

    function gameScreen() {
      return h(
        "main",
        { className: `app-shell game-shell ${selectedTheme.className}` },
        h("header", { className: "game-header" },
          h("button", { className: "ghost-button", onClick: () => setScreen("setup"), type: "button" }, "Options"),
          h("div", { className: "round-meter", "aria-label": `Progression ${progress}%` }, h("span", { style: { width: `${progress}%` } })),
          h("strong", null, `Manche ${round}/${selectedLevel.rounds}`)
        ),
        h("section", { className: "status-panel", "aria-live": "polite" },
          h("p", { className: "message" }, message),
          h("div", { className: "stats" },
            h("span", null, `Score ${score}`),
            h("span", null, `Erreurs ${mistakes}`),
            h("span", null, `Longueur ${currentLength}`)
          )
        ),
        h("section", { className: "memory-board", "aria-label": "Boutons de sequence" },
          selectedTheme.items.map((item) =>
            h("button", {
              key: item.id,
              className: `memory-tile color-${selectedTheme.items.indexOf(item)} ${activeCue === item.id ? "active" : ""}`,
              onClick: () => handleChoice(item.id),
              disabled: isShowing,
              type: "button",
              "aria-label": item.label,
            }, h(Icon, { symbol: item.symbol }))
          )
        ),
        h("div", { className: "action-row" },
          h("button", { className: "secondary-action", onClick: repeatSequence, disabled: isShowing, type: "button" }, "Revoir")
        ),
        h(Footer)
      );
    }

    function summaryScreen() {
      const accuracy = Math.max(0, Math.round(100 - mistakes * 8));
      return h(
        "main",
        { className: `app-shell summary-shell ${selectedTheme.className}` },
        h("section", { className: "summary-panel" },
          h("p", { className: "eyebrow" }, "Fin du jeu"),
          h("h1", null, accuracy >= 80 ? "Belle memoire" : "Partie terminee"),
          h("p", { className: "lead" }, `Niveau ${selectedLevel.fullLabel || selectedLevel.label}: ${score} points et ${accuracy}% de precision.`),
          h("div", { className: "summary-stats" },
            h("span", null, h("strong", null, score), " points"),
            h("span", null, h("strong", null, mistakes), " erreurs"),
            h("span", null, h("strong", null, selectedLevel.rounds), " manches")
          ),
          h("div", { className: "action-row" },
            h("button", { className: "primary-action", onClick: startGame, type: "button" }, "Rejouer"),
            h("button", { className: "secondary-action", onClick: () => setScreen("setup"), type: "button" }, "Options")
          )
        ),
        h(Footer)
      );
    }

    if (screen === "game") return gameScreen();
    if (screen === "summary") return summaryScreen();
    return setupScreen();
  }

  function Footer() {
    return h(
      "footer",
      { className: "site-footer" },
      h("p", null, "Jeu cree par Reda TALA IGHIL."),
      h("a", { href: "https://redaportfolio.website/" }, "Voir mon portfolio")
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
