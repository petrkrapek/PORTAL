// Vyhledání citací českých předpisů a jejich ustanovení v textu stránky.
// Běží celé v prohlížeči – text stránky se nikam neposílá.

import { KNOWN_LAWS, knownLaw, patternSource } from "./laws.js";
import { lawKey, provisionLabel } from "./links.js";

// Číslo předpisu: „89/2012 Sb.“, „č. 12/2001 Sb. m. s.“ (rok čtyřmístně, číslo bez lomítka před ním).
const EXPLICIT = /(?<![\d/])(\d{1,4})\s*\/\s*(\d{4})\s*Sb(?:\.|(?!\p{L}))(\s*m\.\s*s\.)?/gu;

// Začátek ustanovení: „§ 2079“, „§§ 5“, „čl. 10“, „článku 36“, „paragrafu 52“.
const PROVISION =
  /(§§?|(?<!\p{L})[čČ]l(?:\.|án(?:ek|ku|kem|ky|cích|ků)(?!\p{L}))|(?<!\p{L})[pP]aragraf(?:u|em|y|ů)?(?!\p{L}))\s*(\d{1,4}[a-z]?)(?![\p{L}\d/])/gu;

// Upřesnění a výčty za číslem ustanovení (lepivé výrazy – zkoušejí se přesně na dané pozici).
const ODST = /\s*,?\s*odst\.\s*(\d{1,3})(?![\d/])/uy;
const PISM = /\s*,?\s*písm\.\s*([a-z]{1,2})\)?(?!\p{L})/uy;
const BOD = /\s*,?\s*bod(?:u|ě|em|y|ů)?\s*(\d{1,3})\.?(?![\d/])/uy;
const SENTENCE =
  /\s*,?\s*(?:věta|věty|větě|větou|větu)\s+(?:první|druhá|druhé|druhou|třetí|čtvrtá|čtvrté|poslední|před\s+středníkem|za\s+středníkem)(?!\p{L})/uy;
const FOLLOWING = /\s*(?:a\s+násl\.|an\.|a\s+následující\p{L}*)/uy;
const LIST_NUMBER = /\s*(,|a|až|nebo|či|i|–|-)\s*(§§?\s*)?(\d{1,4}[a-z]?)(?![\p{L}\d/])/uy;
const LIST_LETTER = /\s*(,|a|až|nebo|či|i|–|-)\s*([a-z]{1,2})\)/uy;

// Co smí stát mezi ustanovením a předpisem: „§ 5 zákona č. 89/2012 Sb.“, „§ 5 zák. č. …“.
const GAP =
  /^[\s,]*(?:(?:zákon\p{L}*|zák\.|z\.|vyhlášk\p{L}*|nařízení|vlády|ústavní\p{L}*|předpis\p{L}*|sdělení|usnesení|č\.|čís\.|číslo)[\s,]*)*$/iu;
const MAX_GAP = 60;
// „§ 5 téhož zákona“ – ustanovení patří k předpisu zmíněnému naposledy.
const SAME_LAW =
  /[\s,]*(?:(?:téhož|tohoto|citovaného|uvedeného|výše\s+uvedeného|předmětného|daného)\s+(?:zákona|zákoníku|předpisu|nařízení|vyhlášky)|cit\.\s*zák(?:ona|\.)?)(?!\p{L})/iuy;
// Ustanovení předpisů EU a mezinárodních smluv – ty v e-Sbírce nehledáme.
const FOREIGN =
  /[\s,]*(?:GDPR|SFEU|SEU|BGB|StGB|nařízení\s+(?:\(EU\)|\(ES\)|\(EHS\)|Evropského|EP|Rady|Komise)|směrnic\p{L}*|[úÚ]mluv\p{L}*|Smlouv\p{L}*\s+o\s+(?:fungování|Evropské))/uy;
// Předpis, který neznáme („§ 5 horního zákona“, „§ 5 ZOZ“) – nesmí se omylem přiřadit k jinému.
const OTHER_LAW =
  /[\s,]*(?:(?:\p{L}+\s+){0,2}(?:zákon\p{L}*|zákoník\p{L}*|řád\p{L}*|pravidl\p{L}*|vyhlášk\p{L}*|nařízení|předpis\p{L}*)(?!\p{L})|zák\.|\p{Lu}{2,}(?!\p{L}))/uy;
// Bez výslovného předpisu přiřadíme ustanovení k předpisu zmíněnému nejvýše tolik znaků předtím.
const NEARBY = 400;
const SAME_LAW_DISTANCE = 3000;
// Název předpisu hned vedle čísla („zákon č. 89/2012 Sb., občanský zákoník“) je jeho titul, ne další předpis.
const TITLE_GAP = /^[\s,()]*(?:(?:zákon\p{L}*|č\.)[\s,()]*)*$/iu;
const TITLE_DISTANCE = 20;
// Rozsah „§ 5 až 9“ rozepíšeme na jednotlivé paragrafy, jen když je krátký.
const MAX_RANGE = 30;

const FIRST_YEAR = 1918;

const NAMED = KNOWN_LAWS.flatMap((law) =>
  law.names.map((name) => ({ key: law.key, re: new RegExp(patternSource(name), "giu") })),
);
// Zkratky zkoušíme od nejdelší, aby „s. ř. s.“ vyhrálo nad „s. ř.“.
const ABBREVIATIONS = KNOWN_LAWS.flatMap((law) => law.abbrs.map((abbr) => ({ key: law.key, abbr })))
  .sort((a, b) => b.abbr.length - a.abbr.length)
  .map(({ key, abbr }) => ({
    key,
    re: new RegExp(`[\\s,]*${patternSource(abbr, { abbreviation: true })}`, "uy"),
  }));

function sticky(re, text, pos) {
  re.lastIndex = pos;
  return re.exec(text);
}

/** Sjednotí mezery a pomlčky, které se na webu píšou různě (nezlomitelné mezery, en dash…). */
export function normalizeText(text) {
  return text
    .replace(/\u00ad/g, "")
    .replace(/[\u00a0\u2007\u2009\u200a\u202f]/g, " ")
    .replace(/[\u2010-\u2015\u2212]/g, "\u2013");
}

function parseKey(key) {
  const [sbirka, rok, cislo] = key.split("/");
  return { sbirka, rok: Number(rok), cislo: Number(cislo) };
}

/** Zmínky předpisů v textu: číslem i názvem. Seřazené podle pozice. */
function findMentions(text) {
  const maxYear = new Date().getFullYear() + 1;
  const explicit = [];
  for (const m of text.matchAll(EXPLICIT)) {
    const rok = Number(m[2]);
    const cislo = Number(m[1]);
    if (rok < FIRST_YEAR || rok > maxYear || cislo < 1) continue;
    const sbirka = m[3] ? "sm" : "sb";
    explicit.push({ start: m.index, end: m.index + m[0].length, key: lawKey(sbirka, rok, cislo) });
  }

  const named = [];
  for (const { key, re } of NAMED) {
    for (const m of text.matchAll(re)) named.push({ start: m.index, end: m.index + m[0].length, key });
  }

  // Název hned vedle čísla předpisu je jeho titul – zmínka se počítá jen jednou, za číslo.
  for (const mention of named) {
    const title = explicit.find((e) => {
      const gap = e.end <= mention.start ? text.slice(e.end, mention.start) : text.slice(mention.end, e.start);
      return (e.end <= mention.start || mention.end <= e.start) && gap.length <= TITLE_DISTANCE && TITLE_GAP.test(gap);
    });
    if (title) mention.alias = title;
  }

  return [...explicit, ...named].sort((a, b) => a.start - b.start || b.end - a.end);
}

const resolve = (mention) => mention.alias ?? mention;

/** Projde výčet ustanovení od pozice za prvním číslem: „§ 5 odst. 1 písm. a), § 6 a 8 až 10“. */
function scanChain(text, pos, kind, firstNum) {
  let current = { kind, num: firstNum, odst: null, pism: null };
  const items = [current];
  let level = "num";
  // Po výčtu odstavců nebo písmen už další upřesnění („odst. 1 a 2 písm. b)“) nezpřesňuje odkaz.
  let broad = false;
  for (;;) {
    let m;
    if ((m = sticky(ODST, text, pos))) {
      if (!broad) current.odst ??= m[1];
      level = "odst";
    } else if ((m = sticky(PISM, text, pos))) {
      if (!broad) current.pism ??= m[1];
      level = "pism";
    } else if ((m = sticky(BOD, text, pos))) {
      level = "bod";
    } else if ((m = sticky(SENTENCE, text, pos)) || (m = sticky(FOLLOWING, text, pos))) {
      // „věta první“, „a násl.“ – odkaz vede na celé ustanovení.
    } else if (level === "pism" && (m = sticky(LIST_LETTER, text, pos))) {
      // „písm. a) až c)“ – výčet písmen: odkaz povede na celý odstavec, resp. paragraf.
      current.pism = null;
      broad = true;
    } else if ((m = sticky(LIST_NUMBER, text, pos))) {
      const [, separator, sign, value] = m;
      if (sign || level === "num") {
        const from = Number(current.num);
        const to = Number(value);
        const isRange = ["až", "–", "-"].includes(separator) && !sign;
        if (isRange && /^\d+$/.test(current.num) && /^\d+$/.test(value) && to > from && to - from <= MAX_RANGE) {
          for (let n = from + 1; n < to; n++) items.push({ kind, num: String(n), odst: null, pism: null });
        }
        current = { kind, num: value, odst: null, pism: null };
        items.push(current);
        level = "num";
        broad = false;
      } else if (level === "odst") {
        // „odst. 1 a 2“ – výčet odstavců: odkaz povede na celý paragraf. Výčet bodů nic nemění.
        current.odst = current.pism = null;
        broad = true;
      }
    } else {
      break;
    }
    pos += m[0].length;
  }
  return { items, end: pos };
}

/** Ke kterému předpisu patří výčet ustanovení končící na pozici `end` (nebo null). */
function lawForChain(text, start, end, mentions) {
  const next = mentions.find((m) => m.start >= end && m.start - end <= MAX_GAP);
  if (next && GAP.test(text.slice(end, next.start))) return resolve(next).key;

  for (const { key, re } of ABBREVIATIONS) {
    if (sticky(re, text, end)) return key;
  }

  const before = (limit) => {
    let found = null;
    for (const m of mentions) {
      if (m.end > start) break;
      if (start - m.end <= limit) found = m;
    }
    return found && resolve(found).key;
  };

  if (sticky(SAME_LAW, text, end)) return before(SAME_LAW_DISTANCE);
  if (sticky(FOREIGN, text, end) || sticky(OTHER_LAW, text, end)) return null;
  return before(NEARBY);
}

function compareProvisions(a, b) {
  const num = (p) => Number.parseInt(p.num, 10);
  return (
    a.kind.localeCompare(b.kind) ||
    num(a) - num(b) ||
    a.num.localeCompare(b.num) ||
    Number(a.odst ?? 0) - Number(b.odst ?? 0) ||
    (a.pism ?? "").localeCompare(b.pism ?? "")
  );
}

/**
 * Najde v textu citované předpisy a jejich ustanovení.
 * Vrací { laws: [{ key, sbirka, rok, cislo, type, name, provisions: [{ kind, num, odst, pism, label }] }], unassigned }
 * – předpisy v pořadí prvního výskytu, ustanovení seřazená podle čísla; `unassigned` = počet ustanovení,
 * u kterých se nepodařilo určit předpis.
 */
export function findCitations(rawText) {
  const text = normalizeText(rawText ?? "");
  const mentions = findMentions(text);
  const laws = new Map();
  const firstSeen = new Map();

  const lawEntry = (key, position) => {
    let entry = laws.get(key);
    if (!entry) {
      const known = knownLaw(key);
      entry = { key, ...parseKey(key), type: known?.type ?? null, name: known?.name ?? null, provisions: new Map() };
      laws.set(key, entry);
    }
    firstSeen.set(key, Math.min(firstSeen.get(key) ?? Infinity, position));
    return entry;
  };

  for (const mention of mentions) {
    if (!mention.alias) lawEntry(mention.key, mention.start);
  }

  let unassigned = 0;
  PROVISION.lastIndex = 0;
  let m;
  while ((m = PROVISION.exec(text))) {
    const kind = m[1].startsWith("§") || /^p/i.test(m[1]) ? "par" : "cl";
    const chain = scanChain(text, m.index + m[0].length, kind, m[2]);
    PROVISION.lastIndex = chain.end;
    const key = lawForChain(text, m.index, chain.end, mentions);
    if (!key) {
      unassigned += chain.items.length;
      continue;
    }
    const entry = lawEntry(key, m.index);
    for (const item of chain.items) {
      const label = provisionLabel(item);
      if (!entry.provisions.has(label)) entry.provisions.set(label, { ...item, label });
    }
  }

  return {
    laws: [...laws.values()]
      .sort((a, b) => firstSeen.get(a.key) - firstSeen.get(b.key))
      .map(({ provisions, ...law }) => ({
        ...law,
        provisions: [...provisions.values()].sort(compareProvisions),
      })),
    unassigned,
  };
}
