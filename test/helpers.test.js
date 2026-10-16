import { test } from "node:test";
import assert from "node:assert/strict";
import { plural, mapLimit, lawHeading, copyText, czechDate } from "../src/helpers.js";
import { verificationMode, DEFAULTS } from "../src/settings.js";

test("české skloňování podle počtu", () => {
  assert.equal(plural(1, "předpis", "předpisy", "předpisů"), "1 předpis");
  assert.equal(plural(3, "předpis", "předpisy", "předpisů"), "3 předpisy");
  assert.equal(plural(5, "předpis", "předpisy", "předpisů"), "5 předpisů");
  assert.equal(plural(0, "předpis", "předpisy", "předpisů"), "0 předpisů");
});

test("mapLimit nepustí víc úloh najednou, než je limit", async () => {
  let running = 0;
  let peak = 0;
  const seen = [];
  await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, 5));
    seen.push(n);
    running--;
  });
  assert.equal(peak, 3);
  assert.deepEqual(
    seen.sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7],
  );
  await mapLimit([], 3, async () => assert.fail("nemá se volat"));
});

test("nadpis předpisu", () => {
  const law = { sbirka: "sb", rok: 2012, cislo: 89, type: "Zákon" };
  assert.equal(lawHeading(law), "Zákon č. 89/2012 Sb.");
  assert.equal(lawHeading({ ...law, type: null }), "č. 89/2012 Sb.");
});

test("text pro schránku použije ověřený název", () => {
  const laws = [
    {
      key: "sb/2012/89",
      sbirka: "sb",
      rok: 2012,
      cislo: 89,
      type: null,
      name: null,
      provisions: [{ kind: "par", num: "2079", odst: null, pism: null, label: "§ 2079" }],
    },
  ];
  const verified = new Map([["sb/2012/89", { found: true, type: "Zákon", name: "občanský zákoník" }]]);
  assert.equal(
    copyText(laws, verified),
    [
      "Zákon č. 89/2012 Sb., občanský zákoník",
      "https://e-sbirka.gov.cz/sb/2012/89?zalozka=text",
      "  § 2079 – https://e-sbirka.gov.cz/sb/2012/89?zalozka=text#par_2079",
    ].join("\n"),
  );
  assert.match(copyText(laws), /^č\. 89\/2012 Sb\.\n/);
});

test("české datum", () => {
  assert.equal(czechDate("2014-01-01"), "1. 1. 2014");
  assert.equal(czechDate(null), "");
});

test("režim ověření podle nastavení", () => {
  assert.equal(verificationMode(DEFAULTS), "missing-key");
  assert.equal(verificationMode({ ...DEFAULTS, apiKey: "  " }), "missing-key");
  assert.equal(verificationMode({ ...DEFAULTS, apiKey: "klic" }), "api");
  assert.equal(verificationMode({ ...DEFAULTS, source: "cache" }), "cache");
  assert.equal(verificationMode({ ...DEFAULTS, source: "off", apiKey: "klic" }), "off");
});
