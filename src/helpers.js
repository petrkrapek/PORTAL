// Drobné pomocné funkce okna rozšíření.

import { lawCode, lawUrl, provisionUrl } from "./links.js";

/** České skloňování podle počtu: plural(3, "předpis", "předpisy", "předpisů") → „3 předpisy“. */
export function plural(count, one, few, many) {
  const word = count === 1 ? one : count >= 2 && count <= 4 ? few : many;
  return `${count} ${word}`;
}

/** Zavolá `fn` pro všechny položky, nejvýše `limit` najednou. */
export async function mapLimit(items, limit, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Nadpis předpisu: „Zákon č. 89/2012 Sb.“, u neznámého druhu jen „č. 89/2012 Sb.“. */
export function lawHeading(law, type = law.type) {
  return type ? `${type} č. ${lawCode(law)}` : `č. ${lawCode(law)}`;
}

/** Seznam předpisů a ustanovení s odkazy jako prostý text (pro schránku). */
export function copyText(laws, verified = new Map()) {
  const blocks = laws.map((law) => {
    const info = verified.get(law.key);
    const type = info?.found ? info.type : law.type;
    const name = (info?.found && info.name) || law.name;
    const lines = [`${lawHeading(law, type)}${name ? `, ${name}` : ""}`, lawUrl(law)];
    for (const provision of law.provisions) lines.push(`  ${provision.label} – ${provisionUrl(law, provision)}`);
    return lines.join("\n");
  });
  return blocks.join("\n\n");
}

/** Datum z API (RRRR-MM-DD) v českém zápisu „1. 1. 2014“. */
export function czechDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${Number(m[3])}. ${Number(m[2])}. ${m[1]}` : (iso ?? "");
}
