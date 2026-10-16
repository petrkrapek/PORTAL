import { findCitations } from "./citations.js";
import { lawUrl, provisionUrl, staleUrl } from "./links.js";
import { fetchLaw, fetchProvision, provisionQuery, SOURCE_BASES } from "./esbirka.js";
import { loadSettings, verificationMode } from "./settings.js";
import { plural, mapLimit, lawHeading, copyText, czechDate } from "./helpers.js";

// Horní mez délky textu stránky (znaky). I úplné znění občanského zákoníku je kratší.
const MAX_CHARS = 3_000_000;
// Kolik předpisů a ustanovení nejvýš ověřujeme a kolik dotazů posíláme do e-Sbírky najednou.
const MAX_LAW_CHECKS = 30;
const MAX_PROVISION_CHECKS = 60;
const CONCURRENCY = 4;

const $ = (id) => document.getElementById(id);
const els = {
  title: $("page-title"),
  meta: $("meta"),
  status: $("status"),
  notice: $("notice"),
  error: $("error"),
  empty: $("empty"),
  laws: $("laws"),
  hint: $("hint"),
  copy: $("copy"),
  rescan: $("rescan"),
  options: $("options"),
};

let settings = null;
let tab = null;
let controller = null;
let laws = [];
let rows = new Map();
const verified = new Map();
let openedTabs = 0;

const openOptions = () => chrome.runtime.openOptionsPage();

function setStatus(text) {
  els.status.textContent = text;
  els.status.hidden = !text;
}

// Hláška s volitelným tlačítkem (např. „Nastavit“ → otevře nastavení).
function showMessage(el, text, action) {
  el.replaceChildren();
  el.hidden = !text;
  if (!text) return;
  el.append(text);
  if (action) {
    const button = document.createElement("button");
    button.className = "action";
    button.textContent = action.label;
    button.addEventListener("click", action.onClick);
    el.append(" ", button);
  }
}
const showNotice = (text, action) => showMessage(els.notice, text, action);
const showError = (text, action) => showMessage(els.error, text, action);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function openArrow() {
  const arrow = el("span", "open", "↗");
  arrow.setAttribute("aria-hidden", "true");
  return arrow;
}

// Funkce běží uvnitř stránky (injektuje ji chrome.scripting) – nesmí používat nic zvenku.
function extractPageText() {
  return { title: document.title, text: document.body?.innerText ?? "" };
}

async function readPage() {
  try {
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageText });
    return result.result;
  } catch {
    throw new Error(
      "Tuto stránku nelze přečíst. Rozšíření nefunguje na interních stránkách Chromu, v Internetovém obchodě Chrome ani v prohlížeči PDF.",
    );
  }
}

// Výsledky z e-Sbírky pamatujeme do zavření prohlížeče – opakované otevření okna nic nestojí.
async function cached(key, load) {
  try {
    const hit = (await chrome.storage.session.get(key))[key];
    if (hit) return hit;
  } catch {
    // Úložiště není k dispozici – prostě se zeptáme znovu.
  }
  const value = await load();
  try {
    await chrome.storage.session.set({ [key]: value });
  } catch {
    // Nevadí, příště se zeptáme znovu.
  }
  return value;
}

function render() {
  rows = new Map();
  const items = laws.map((law) => {
    const li = el("li", "law");
    const link = el("a");
    link.href = lawUrl(law);
    link.title = "Otevřít předpis v e-Sbírce";
    const dot = el("span", "dot");
    const text = el("span", "law-text");
    const code = el("div", "law-code", lawHeading(law));
    const name = el("div", "law-name", law.name ?? "");
    text.append(code, name);
    const chip = el("span", "chip");
    link.append(dot, text, chip, openArrow());
    li.append(link);

    // Řádky ustanovení podle dotazu do e-Sbírky („§ 2079“ sdílí i „§ 2079 odst. 2“).
    const provisions = new Map();
    if (law.provisions.length) {
      const list = el("ul", "provisions");
      for (const provision of law.provisions) {
        const item = el("li", "provision");
        const a = el("a");
        a.href = provisionUrl(law, provision);
        a.title = `Otevřít ${provision.label} v e-Sbírce`;
        const label = el("span", "provision-label", provision.label);
        const provisionName = el("span", "provision-name");
        a.append(label, provisionName, openArrow());
        item.append(a);
        list.append(item);
        const query = provisionQuery(provision);
        if (!provisions.has(query)) provisions.set(query, { provision, rows: [] });
        provisions.get(query).rows.push({ item, name: provisionName });
      }
      li.append(list);
    }
    rows.set(law.key, { dot, chip, code, name, link, provisions });
    return li;
  });
  els.laws.replaceChildren(...items);
}

function setTone(row, tone, chipText = "", title = "") {
  row.dot.dataset.tone = tone;
  row.chip.dataset.tone = tone;
  row.chip.textContent = chipText;
  row.chip.title = title;
}

function applyLaw(law, info) {
  const row = rows.get(law.key);
  if (!info.found) {
    setTone(row, "warn", "nenalezen", "Předpis s tímto číslem v e-Sbírce není – zkontrolujte citaci na stránce.");
    return;
  }
  row.code.textContent = lawHeading(law, info.type || law.type);
  row.name.textContent = info.name || law.name || "";
  row.link.title = info.citation ? `${info.citation} – otevřít v e-Sbírce` : row.link.title;
  if (info.repealed) setTone(row, "bad", "zrušen", `Zrušen k ${czechDate(info.repealedOn)}`);
  else if (info.neverEffective) setTone(row, "warn", "neúčinný", "Předpis nikdy nenabyl účinnosti.");
  else setTone(row, "ok", "", "");
}

function setMeta(state) {
  const provisionCount = laws.reduce((sum, law) => sum + law.provisions.length, 0);
  const parts = [plural(laws.length, "předpis", "předpisy", "předpisů")];
  if (provisionCount) parts.push(plural(provisionCount, "ustanovení", "ustanovení", "ustanovení"));
  if (state) parts.push(state);
  els.meta.textContent = parts.join(" · ");
}

async function verifyProvisions(checked, options, signal) {
  const tasks = [];
  for (const law of checked) {
    const info = verified.get(law.key);
    // U zrušených předpisů se ustanovení neověřují – v posledním znění být nemusí.
    if (!info?.found || info.repealed) continue;
    for (const [query, entry] of rows.get(law.key).provisions) {
      tasks.push({ law, query, entry, stale: info.staleUrl || staleUrl(law) });
    }
  }
  let stop = false;
  await mapLimit(tasks.slice(0, MAX_PROVISION_CHECKS), CONCURRENCY, async ({ law, query, entry, stale }) => {
    if (signal.aborted || stop) return;
    try {
      const mode = verificationMode(settings);
      const key = `provision:${mode}:${law.key}:${query}`;
      const result = await cached(key, () => fetchProvision(stale, entry.provision, options));
      for (const row of entry.rows) {
        if (result.found === false) {
          row.item.dataset.missing = "";
          row.name.textContent = "v aktuálním znění není";
        } else if (result.found && result.name) {
          row.name.textContent = result.name;
          row.name.title = result.name;
        }
      }
    } catch (err) {
      // Názvy paragrafů jsou jen doplněk – při chybě je přestaneme dohledávat a nic nehlásíme.
      stop = true;
      if (!signal.aborted) console.warn("Paragrafy: ustanovení se nepodařilo ověřit", err);
    }
  });
}

async function verify(signal) {
  const mode = verificationMode(settings);
  if (mode === "off") return setMeta("bez ověření");
  if (mode === "missing-key") {
    setMeta("bez ověření");
    showNotice("Předpisy se neověřují – v nastavení chybí API klíč e-Sbírky. Odkazy fungují i bez něj.", {
      label: "Nastavit",
      onClick: openOptions,
    });
    return;
  }

  const options = { base: SOURCE_BASES[mode], apiKey: mode === "api" ? settings.apiKey.trim() : "", signal };
  const checked = laws.slice(0, MAX_LAW_CHECKS);
  for (const law of checked) setTone(rows.get(law.key), "pending");
  setMeta("ověřuji v e-Sbírce…");

  let failure = null;
  await mapLimit(checked, CONCURRENCY, async (law) => {
    if (signal.aborted || failure?.unauthorized) return;
    try {
      const info = await cached(`law:${mode}:${law.key}`, () => fetchLaw(law, options));
      verified.set(law.key, info);
      applyLaw(law, info);
    } catch (err) {
      if (signal.aborted) return;
      if (!failure || err.unauthorized) failure = err;
      setTone(rows.get(law.key), "", "?", err.message);
    }
  });
  if (signal.aborted) return;

  // Předpisy, na které po chybě nedošlo, nenecháme blikat.
  for (const law of checked) {
    if (!verified.has(law.key) && rows.get(law.key).dot.dataset.tone === "pending") setTone(rows.get(law.key), "");
  }

  if (failure?.unauthorized) {
    setMeta("bez ověření");
    showError(`${failure.message} Odkazy fungují i bez ověření.`, { label: "Otevřít nastavení", onClick: openOptions });
    return;
  }
  if (failure) {
    setMeta("ověření se nepovedlo");
    showNotice(`Ověření v e-Sbírce se nepovedlo: ${failure.message} Odkazy fungují i tak.`);
  } else {
    const rest = laws.length - checked.length;
    setMeta(rest > 0 ? `ověřeno prvních ${checked.length}` : "ověřeno v e-Sbírce");
  }
  if (settings.checkProvisions) await verifyProvisions(checked, options, signal);
}

async function scan() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  showError("");
  showNotice("");
  els.empty.hidden = true;
  els.laws.replaceChildren();
  els.meta.textContent = "";
  els.copy.disabled = true;
  els.rescan.disabled = true;
  els.hint.hidden = true;
  laws = [];
  verified.clear();

  try {
    settings = await loadSettings();
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    els.title.textContent = tab?.title || "Aktuální stránka";

    setStatus("Hledám citace předpisů…");
    const page = await readPage();
    let text = page.text ?? "";
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
      showNotice("Stránka je velmi dlouhá – citace hledám jen v její první části.");
    }
    const found = findCitations(text);
    if (signal.aborted) return;
    setStatus("");
    laws = found.laws;

    if (!laws.length) {
      els.empty.hidden = false;
      return;
    }
    render();
    if (found.unassigned) {
      const note = el(
        "li",
        "unassigned",
        `${plural(found.unassigned, "další ustanovení", "další ustanovení", "dalších ustanovení")} bez určeného předpisu – na stránce u nich chybí číslo nebo název zákona.`,
      );
      els.laws.append(note);
    }
    els.copy.disabled = false;
    els.hint.hidden = false;
    setMeta("");
    await verify(signal);
  } catch (err) {
    if (signal.aborted) return;
    setStatus("");
    showError(err.message);
  } finally {
    if (!signal.aborted) els.rescan.disabled = false;
  }
}

async function openLink(url, how) {
  if (how === "window") {
    await chrome.windows.create({ url, focused: true });
    return;
  }
  const props = { url, active: how !== "background" };
  // Odkazy otevřené na pozadí řadíme za aktuální kartu v pořadí, v jakém se klikalo.
  if (tab) Object.assign(props, { windowId: tab.windowId, index: tab.index + 1 + openedTabs++ });
  await chrome.tabs.create(props);
}

els.laws.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (!link) return;
  e.preventDefault();
  const how = e.shiftKey ? "window" : e.ctrlKey || e.metaKey ? "background" : settings?.openIn;
  openLink(link.href, how).catch((err) => showError(`Odkaz se nepodařilo otevřít: ${err.message}`));
});
// Kolečko myši otevře odkaz na pozadí jako v běžném prohlížeči.
els.laws.addEventListener("auxclick", (e) => {
  const link = e.target.closest("a[href]");
  if (!link || e.button !== 1) return;
  e.preventDefault();
  openLink(link.href, "background").catch((err) => showError(`Odkaz se nepodařilo otevřít: ${err.message}`));
});

els.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyText(laws, verified));
    els.copy.textContent = "Zkopírováno ✓";
  } catch {
    els.copy.textContent = "Nelze kopírovat";
  }
  setTimeout(() => (els.copy.textContent = "Kopírovat"), 1500);
});
els.rescan.addEventListener("click", () => scan());
els.options.addEventListener("click", openOptions);

if (/Mac/i.test(navigator.platform)) els.hint.textContent = "⌘ + klik otevře odkaz na pozadí";

scan();
