import { test } from "node:test";
import assert from "node:assert/strict";
import { findCitations, normalizeText } from "../src/citations.js";

// Zjednodušený výsledek: { "89/2012": ["§ 2079 odst. 2", …] }.
function cite(text) {
  const { laws } = findCitations(text);
  return Object.fromEntries(laws.map((law) => [`${law.cislo}/${law.rok}`, law.provisions.map((p) => p.label)]));
}

test("najde předpis podle čísla a ustanovení před ním", () => {
  assert.deepEqual(cite("Podle § 2079 odst. 2 zákona č. 89/2012 Sb., občanský zákoník, platí…"), {
    "89/2012": ["§ 2079 odst. 2"],
  });
});

test("doplní druh a název u známého předpisu", () => {
  const [law] = findCitations("zákon č. 262/2006 Sb.").laws;
  assert.equal(law.key, "sb/2006/262");
  assert.equal(law.type, "Zákon");
  assert.equal(law.name, "zákoník práce");
});

test("neznámý předpis citovaný číslem nemá název", () => {
  const [law] = findCitations("vyhláška č. 123/2018 Sb.").laws;
  assert.deepEqual({ key: law.key, type: law.type, name: law.name }, { key: "sb/2018/123", type: null, name: null });
});

test("pozná název předpisu ve všech pádech", () => {
  assert.deepEqual(cite("§ 52 písm. c) zákoníku práce a § 2079 občanského zákoníku"), {
    "262/2006": ["§ 52 písm. c)"],
    "89/2012": ["§ 2079"],
  });
  assert.deepEqual(cite("Podle § 45 zákona o zdravotních službách"), { "372/2011": ["§ 45"] });
});

test("pozná zkratky za paragrafem", () => {
  assert.deepEqual(cite("§ 2079 OZ, § 68 odst. 3 s. ř. s., § 36 s.ř. a § 114 o. s. ř."), {
    "89/2012": ["§ 2079"],
    "150/2002": ["§ 68 odst. 3"],
    "500/2004": ["§ 36"],
    "99/1963": ["§ 114"],
  });
});

test("zkratka uprostřed věty bez paragrafu se za předpis nepovažuje", () => {
  assert.deepEqual(cite("OZ a ZP jsou běžné zkratky."), {});
});

test("články Ústavy a Listiny", () => {
  assert.deepEqual(cite("Článek 36 Listiny základních práv a svobod a čl. 10 Ústavy."), {
    "2/1993": ["čl. 36"],
    "1/1993": ["čl. 10"],
  });
});

test("Ústavní soud není Ústava", () => {
  assert.deepEqual(cite("Ústavní soud České republiky rozhodl"), {});
});

test("výčty a rozsahy paragrafů", () => {
  assert.deepEqual(cite("§ 5, 6 a 8 zákona č. 89/2012 Sb."), { "89/2012": ["§ 5", "§ 6", "§ 8"] });
  assert.deepEqual(cite("§§ 10 až 12 zákona č. 89/2012 Sb."), { "89/2012": ["§ 10", "§ 11", "§ 12"] });
  assert.deepEqual(cite("§ 3–4 a § 7a zákona č. 89/2012 Sb."), { "89/2012": ["§ 3", "§ 4", "§ 7a"] });
});

test("výčet odstavců a písmen není výčet paragrafů – odkaz vede o úroveň výš", () => {
  assert.deepEqual(cite("§ 5 odst. 1 a 2 zákona č. 89/2012 Sb."), { "89/2012": ["§ 5"] });
  assert.deepEqual(cite("§ 52 písm. a) až c) zákoníku práce"), { "262/2006": ["§ 52"] });
  assert.deepEqual(cite("§ 5 odst. 1 písm. a) a b) zákoníku práce"), { "262/2006": ["§ 5 odst. 1"] });
  assert.deepEqual(cite("§ 5 odst. 1 a 2 písm. b) a § 6 odst. 3 zákoníku práce"), {
    "262/2006": ["§ 5", "§ 6 odst. 3"],
  });
  assert.deepEqual(cite("§ 55 odst. 1 písm. b) bod 2 věta první zákoníku práce"), {
    "262/2006": ["§ 55 odst. 1 písm. b)"],
  });
});

test("„a násl.“ a „téhož zákona“", () => {
  assert.deepEqual(cite("§ 2079 a násl. občanského zákoníku; § 2085 téhož zákona"), {
    "89/2012": ["§ 2079", "§ 2085"],
  });
});

test("paragraf bez předpisu patří k předpisu zmíněnému těsně předtím", () => {
  assert.deepEqual(cite("Zákon č. 262/2006 Sb. stanoví… Podle § 55 odst. 1 může zaměstnavatel…"), {
    "262/2006": ["§ 55 odst. 1"],
  });
});

test("paragraf daleko od předpisu se nepřiřadí", () => {
  const result = findCitations(`Zákon č. 262/2006 Sb. ${"x ".repeat(400)} Podle § 55 může…`);
  assert.deepEqual(result.laws[0].provisions, []);
  assert.equal(result.unassigned, 1);
});

test("ustanovení neznámého nebo zahraničního předpisu se nepřiřadí k jinému", () => {
  const result = findCitations("Zákon č. 89/2012 Sb. … čl. 6 odst. 1 písm. b) GDPR a § 12 horního zákona, § 3 ZOZ");
  assert.deepEqual(result.laws[0].provisions, []);
  assert.equal(result.unassigned, 3);
});

test("název hned za číslem je titul předpisu, ne další předpis", () => {
  assert.deepEqual(cite("zákon č. 40/1964 Sb., občanský zákoník, § 420"), { "40/1964": ["§ 420"] });
  assert.deepEqual(cite("Podle § 45 zákona o zdravotních službách (zákon č. 372/2011 Sb.)"), {
    "372/2011": ["§ 45"],
  });
});

test("Sbírka mezinárodních smluv", () => {
  const [law] = findCitations("čl. 3 sdělení č. 209/1992 Sb. m. s.").laws;
  assert.equal(law.key, "sm/1992/209");
  assert.deepEqual(
    law.provisions.map((p) => p.label),
    ["čl. 3"],
  );
});

test("nezlomitelné mezery a pomlčky z webu", () => {
  assert.deepEqual(cite("§\u00a05\u2013\u20097 zákona č.\u00a089/2012\u00a0Sb."), {
    "89/2012": ["§ 5", "§ 6", "§ 7"],
  });
  assert.equal(normalizeText("a\u00adb\u202fc\u2014d"), "ab c–d");
});

test("nesmyslné roky a čísla nejsou předpisy", () => {
  assert.deepEqual(cite("1/1800 Sb., 12/3000 Sb., 0/2012 Sb., 2012/89 Sb.írka"), {});
});

test("předpisy jsou v pořadí výskytu, ustanovení podle čísla a bez duplicit", () => {
  const { laws } = findCitations(
    "zákoník práce … § 100 OZ, § 20 OZ, § 3 odst. 2 OZ, § 3 OZ, § 20 OZ, § 3 odst. 1 písm. a) OZ, § 3a OZ",
  );
  assert.deepEqual(
    laws.map((l) => l.key),
    ["sb/2006/262", "sb/2012/89"],
  );
  assert.deepEqual(
    laws[1].provisions.map((p) => p.label),
    ["§ 3", "§ 3 odst. 1 písm. a)", "§ 3 odst. 2", "§ 3a", "§ 20", "§ 100"],
  );
});

test("prázdný text", () => {
  assert.deepEqual(findCitations(""), { laws: [], unassigned: 0 });
  assert.deepEqual(findCitations(undefined), { laws: [], unassigned: 0 });
});
