import { test } from "node:test";
import assert from "node:assert/strict";
import { lawCode, lawUrl, provisionAnchor, provisionUrl, provisionLabel, staleUrl } from "../src/links.js";

const oz = { sbirka: "sb", rok: 2012, cislo: 89 };

test("staleUrl a číslo předpisu", () => {
  assert.equal(staleUrl(oz), "/sb/2012/89");
  assert.equal(lawCode(oz), "89/2012 Sb.");
  assert.equal(lawCode({ sbirka: "sm", rok: 1992, cislo: 209 }), "209/1992 Sb. m. s.");
});

test("odkaz na text předpisu na portálu e-Sbírka", () => {
  assert.equal(lawUrl(oz), "https://e-sbirka.gov.cz/sb/2012/89?zalozka=text");
});

test("kotvy ustanovení odpovídají portálu", () => {
  assert.equal(provisionAnchor({ kind: "par", num: "2079" }), "par_2079");
  assert.equal(provisionAnchor({ kind: "par", num: "2079", odst: "2" }), "par_2079-odst_2");
  assert.equal(provisionAnchor({ kind: "par", num: "310", pism: "c" }), "par_310-pism_c");
  assert.equal(provisionAnchor({ kind: "par", num: "52", odst: "1", pism: "a" }), "par_52-odst_1-pism_a");
  assert.equal(provisionAnchor({ kind: "cl", num: "10" }), "cl_10");
  assert.equal(
    provisionUrl(oz, { kind: "par", num: "14a", odst: "3" }),
    "https://e-sbirka.gov.cz/sb/2012/89?zalozka=text#par_14a-odst_3",
  );
});

test("popisek ustanovení", () => {
  assert.equal(provisionLabel({ kind: "par", num: "52", odst: "1", pism: "c" }), "§ 52 odst. 1 písm. c)");
  assert.equal(provisionLabel({ kind: "cl", num: "36", odst: null, pism: null }), "čl. 36");
});
