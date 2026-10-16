import { loadSettings, saveSettings, verificationMode, SOURCES, OPEN_IN } from "./settings.js";
import { fetchLaw, SOURCE_BASES } from "./esbirka.js";

const form = document.getElementById("form");
const status = document.getElementById("status");
const $ = (id) => document.getElementById(id);

// Přepínač z položek s popiskem „Název – popis“ (zdroj dat, kam otevírat odkazy).
function fillChoices(container, name, items) {
  for (const item of items) {
    const [title, sub] = item.label.split(" – ");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = item.id;
    label.append(input, title);
    if (sub) {
      const small = document.createElement("span");
      small.className = "sub";
      small.textContent = sub;
      label.append(small);
    }
    container.append(label);
  }
}

fillChoices($("source-choices"), "source", SOURCES);
fillChoices($("openIn-choices"), "openIn", OPEN_IN);
$("version").textContent = chrome.runtime.getManifest().version;

function collect() {
  return {
    source: form.source.value,
    apiKey: form.apiKey.value.trim(),
    checkProvisions: form.checkProvisions.checked,
    openIn: form.openIn.value,
  };
}

function setStatus(text, tone = "") {
  status.textContent = text;
  status.dataset.tone = tone;
}

function setTestResult(text, tone = "") {
  $("test-result").textContent = text;
  $("test-result").dataset.tone = tone;
}

const BADGES = {
  api: ["Připraveno · API", "ok"],
  cache: ["Připraveno · cache", "ok"],
  off: ["Vypnuto", ""],
  "missing-key": ["Chybí klíč", "warn"],
};

// Zobrazí jen pole zvoleného zdroje a aktualizuje stavový štítek.
function refresh() {
  const values = collect();
  $("source-api").hidden = values.source !== "api";
  $("source-cache").hidden = values.source !== "cache";
  $("provisions-field").hidden = values.source === "off";
  $("test-row").hidden = values.source === "off";
  const [text, tone] = BADGES[verificationMode(values)];
  $("badge-source").textContent = text;
  $("badge-source").dataset.tone = tone;
}

async function load() {
  const settings = await loadSettings();
  form.source.value = settings.source;
  form.apiKey.value = settings.apiKey;
  form.checkProvisions.checked = settings.checkProvisions;
  form.openIn.value = settings.openIn;
  refresh();
}

form.addEventListener("input", () => {
  refresh();
  setTestResult("");
  setStatus("Neuložené změny", "dirty");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const values = collect();
  form.apiKey.value = values.apiKey;
  await saveSettings(values);
  // Po změně zdroje zahodíme uložené výsledky ověření, ať se načtou znovu.
  await chrome.storage.session.clear();
  setStatus("Uloženo ✓", "ok");
  setTimeout(() => {
    if (status.dataset.tone === "ok") setStatus("");
  }, 2000);
});

// Zkušební dotaz na Ústavu (1/1993 Sb.) s aktuálně vyplněnými (i neuloženými) údaji.
$("test").addEventListener("click", async () => {
  const values = collect();
  const mode = verificationMode(values);
  if (mode === "missing-key") {
    setTestResult("Nejdřív vyplňte API klíč.", "error");
    form.apiKey.focus();
    return;
  }
  $("test").disabled = true;
  setTestResult("Zkouším…");
  try {
    const info = await fetchLaw(
      { sbirka: "sb", rok: 1993, cislo: 1 },
      { base: SOURCE_BASES[mode], apiKey: mode === "api" ? values.apiKey : "" },
    );
    if (!info.found) throw new Error("e-Sbírka odpověděla, ale zkušební předpis nenašla.");
    setTestResult(`Funguje ✓ ${info.citation}`, "ok");
  } catch (err) {
    setTestResult(err.message, "error");
  } finally {
    $("test").disabled = false;
  }
});

for (const button of document.querySelectorAll(".toggle")) {
  button.addEventListener("click", () => {
    const input = form[button.dataset.for];
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.textContent = hidden ? "Skrýt" : "Zobrazit";
  });
}

load();
