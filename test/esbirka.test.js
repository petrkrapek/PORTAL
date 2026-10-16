import { test } from "node:test";
import assert from "node:assert/strict";
import {
  documentUrl,
  fetchLaw,
  fetchProvision,
  parseLaw,
  splitCitation,
  provisionQuery,
  EsbirkaError,
  SOURCE_BASES,
} from "../src/esbirka.js";

const oz = { sbirka: "sb", rok: 2012, cislo: 89 };

function mockFetch(status, body) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (typeof body === "string") throw new SyntaxError("není JSON");
        return body;
      },
    };
  };
  return { fetchImpl, calls };
}

test("staleUrl je v cestě celé zakódované", () => {
  assert.equal(
    documentUrl(SOURCE_BASES.api, "/sb/2012/89/2026-01-01", "/nabidka-ustanoveni", { text: "§ 2079", maxPocet: 5 }),
    "https://api.e-sbirka.gov.cz/dokumenty-sbirky/%2Fsb%2F2012%2F89%2F2026-01-01/nabidka-ustanoveni?text=%C2%A7+2079&maxPocet=5",
  );
});

test("fetchLaw pošle klíč v hlavičce esel-api-access-key a vrátí název", async () => {
  const { fetchImpl, calls } = mockFetch(200, {
    uplnaCitace: "Zákon č. 89/2012 Sb., občanský zákoník",
    staleUrl: "/sb/2012/89/2026-01-01",
    datumZruseni: null,
  });
  const info = await fetchLaw(oz, { base: SOURCE_BASES.api, apiKey: "tajny", fetchImpl });
  assert.equal(calls[0].url, "https://api.e-sbirka.gov.cz/dokumenty-sbirky/%2Fsb%2F2012%2F89");
  assert.equal(calls[0].init.headers["esel-api-access-key"], "tajny");
  assert.deepEqual(info, {
    found: true,
    citation: "Zákon č. 89/2012 Sb., občanský zákoník",
    type: "Zákon",
    name: "občanský zákoník",
    repealed: false,
    repealedOn: null,
    neverEffective: false,
    staleUrl: "/sb/2012/89/2026-01-01",
  });
});

test("veřejná cache se volá bez klíče", async () => {
  const { fetchImpl, calls } = mockFetch(200, { uplnaCitace: "Ústavní zákon č. 1/1993 Sb., Ústava České republiky" });
  await fetchLaw({ sbirka: "sb", rok: 1993, cislo: 1 }, { base: SOURCE_BASES.cache, fetchImpl });
  assert.equal(calls[0].url, "https://e-sbirka.gov.cz/sbr-cache/dokumenty-sbirky/%2Fsb%2F1993%2F1");
  assert.equal(calls[0].init.headers["esel-api-access-key"], undefined);
});

test("nenalezený předpis není chyba", async () => {
  const { fetchImpl } = mockFetch(400, { chyby: [{ kod: "DOKUMENT_NENALEZEN", popis: "Dokument nenalezen" }] });
  assert.deepEqual(await fetchLaw(oz, { base: SOURCE_BASES.api, apiKey: "k", fetchImpl }), { found: false });
});

test("neplatný klíč vyhodí srozumitelnou chybu", async () => {
  const { fetchImpl } = mockFetch(401, { chyby: [{ kod: "NEPLATNY_API_KLIC", popis: "Nezaslán API klíč." }] });
  await assert.rejects(fetchLaw(oz, { base: SOURCE_BASES.api, apiKey: "spatny", fetchImpl }), (err) => {
    assert.ok(err instanceof EsbirkaError);
    assert.equal(err.unauthorized, true);
    assert.match(err.message, /API klíč/);
    return true;
  });
});

test("chyba serveru a výpadek sítě", async () => {
  const { fetchImpl } = mockFetch(503, "<html>");
  await assert.rejects(fetchLaw(oz, { base: SOURCE_BASES.api, fetchImpl }), /dočasně nedostupná \(HTTP 503\)/);
  const offline = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(fetchLaw(oz, { base: SOURCE_BASES.api, fetchImpl: offline }), /neodpovídá/);
});

test("zrušený předpis", () => {
  const info = parseLaw(
    { uplnaCitace: "Zákon č. 40/1964 Sb., občanský zákoník", datumZruseni: "2014-01-01" },
    new Date("2026-10-16T12:00:00Z"),
  );
  assert.equal(info.repealed, true);
  assert.equal(info.repealedOn, "2014-01-01");
  // Zrušení s budoucím datem ještě neplatí.
  assert.equal(parseLaw({ datumZruseni: "2030-01-01" }, new Date("2026-10-16")).repealed, false);
});

test("rozdělení úplné citace", () => {
  assert.deepEqual(splitCitation("Nařízení vlády č. 590/2006 Sb., kterým se stanoví okruh a rozsah jiných úkonů"), {
    type: "Nařízení vlády",
    name: "kterým se stanoví okruh a rozsah jiných úkonů",
  });
  assert.deepEqual(splitCitation("Sdělení č. 209/1992 Sb. m. s., o sjednání Úmluvy"), {
    type: "Sdělení",
    name: "o sjednání Úmluvy",
  });
  assert.deepEqual(splitCitation("Bez čísla"), { type: "", name: "Bez čísla" });
});

test("dotaz na ustanovení", () => {
  assert.equal(provisionQuery({ kind: "par", num: "14a", odst: "2" }), "§ 14a");
  assert.equal(provisionQuery({ kind: "cl", num: "10" }), "čl. 10");
});

test("fetchProvision vybere přesně dané ustanovení a vrátí jeho název", async () => {
  const { fetchImpl, calls } = mockFetch(200, {
    fragmentyNabidky: [
      { identifikaceUstanoveni: "§ 2079 odst. 1", nazev: "", fragmentId: 2 },
      { identifikaceUstanoveni: "§ 2079", nazev: "Kupní smlouva", fragmentId: 1 },
      { identifikaceUstanoveni: "§ 2079a", nazev: "Jiný", fragmentId: 3 },
    ],
  });
  const result = await fetchProvision(
    "/sb/2012/89/2026-01-01",
    { kind: "par", num: "2079", odst: "1" },
    { base: SOURCE_BASES.api, apiKey: "k", fetchImpl },
  );
  assert.deepEqual(result, { found: true, name: "Kupní smlouva" });
  assert.match(calls[0].url, /%2Fsb%2F2012%2F89%2F2026-01-01\/nabidka-ustanoveni\?text=%C2%A7\+2079&maxPocet=5$/);
});

test("fetchProvision: žádná nabídka = nenalezeno, nejasná nabídka = neví", async () => {
  const empty = mockFetch(200, { fragmentyNabidky: [] });
  assert.deepEqual(
    await fetchProvision(
      "/sb/2012/89",
      { kind: "par", num: "9999" },
      { base: "https://x", fetchImpl: empty.fetchImpl },
    ),
    { found: false },
  );
  const other = mockFetch(200, { fragmentyNabidky: [{ identifikaceUstanoveni: "§ 20", nazev: "x" }] });
  assert.deepEqual(
    await fetchProvision("/sb/2012/89", { kind: "par", num: "2" }, { base: "https://x", fetchImpl: other.fetchImpl }),
    { found: null },
  );
});
