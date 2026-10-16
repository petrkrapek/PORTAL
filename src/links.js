// Identifikátory předpisů a odkazy na jejich text na portálu e-Sbírka.

export const PORTAL = "https://e-sbirka.gov.cz";

/** Klíč předpisu, např. „sb/2012/89“ (sbírka/rok/číslo). */
export function lawKey(sbirka, rok, cislo) {
  return `${sbirka}/${rok}/${cislo}`;
}

/** staleUrl předpisu v e-Sbírce, např. „/sb/2012/89“ (server ho přesměruje na aktuální znění). */
export function staleUrl(law) {
  return `/${law.sbirka}/${law.rok}/${law.cislo}`;
}

/** Číslo předpisu tak, jak se cituje: „89/2012 Sb.“, resp. „12/2001 Sb. m. s.“. */
export function lawCode(law) {
  return `${law.cislo}/${law.rok} ${law.sbirka === "sm" ? "Sb. m. s." : "Sb."}`;
}

/** Text předpisu na portálu e-Sbírka. */
export function lawUrl(law) {
  return `${PORTAL}${staleUrl(law)}?zalozka=text`;
}

/** Kotva ustanovení na portálu: „par_2079“, „par_2079-odst_2“, „par_310-pism_c“, „cl_10“. */
export function provisionAnchor(provision) {
  const parts = [`${provision.kind}_${provision.num}`];
  if (provision.odst) parts.push(`odst_${provision.odst}`);
  if (provision.pism) parts.push(`pism_${provision.pism}`);
  return parts.join("-");
}

/** Odkaz přímo na ustanovení v textu předpisu. */
export function provisionUrl(law, provision) {
  return `${lawUrl(law)}#${provisionAnchor(provision)}`;
}

/** Ustanovení tak, jak se cituje: „§ 2079 odst. 2 písm. c)“, „čl. 10“. */
export function provisionLabel(provision) {
  let label = `${provision.kind === "cl" ? "čl." : "§"} ${provision.num}`;
  if (provision.odst) label += ` odst. ${provision.odst}`;
  if (provision.pism) label += ` písm. ${provision.pism})`;
  return label;
}
