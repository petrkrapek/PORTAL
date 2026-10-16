// Ověření předpisů a ustanovení přes REST API e-Sbírky (https://e-sbirka.gov.cz/restful-api).
// Oficiální API chce klíč v hlavičce esel-api-access-key; veřejná cache portálu má stejné cesty bez klíče.

import { staleUrl } from "./links.js";

export const SOURCE_BASES = {
  api: "https://api.e-sbirka.gov.cz",
  cache: "https://e-sbirka.gov.cz/sbr-cache",
};

export class EsbirkaError extends Error {
  constructor(message, { status = 0, code = "" } = {}) {
    super(message);
    this.name = "EsbirkaError";
    this.status = status;
    this.code = code;
  }

  /** Neplatný nebo chybějící klíč – nemá smysl zkoušet další dotazy. */
  get unauthorized() {
    return this.status === 401 || this.status === 403 || this.code === "NEPLATNY_API_KLIC";
  }

  get notFound() {
    return this.status === 404 || this.code === "DOKUMENT_NENALEZEN";
  }
}

function describe(status, code, popis) {
  if (status === 401 || status === 403 || code === "NEPLATNY_API_KLIC") {
    return "API klíč e-Sbírky je neplatný nebo chybí.";
  }
  if (status === 404 || code === "DOKUMENT_NENALEZEN") return "Předpis v e-Sbírce není.";
  if (status === 429) return "e-Sbírka hlásí příliš mnoho dotazů – zkuste to za chvíli.";
  if (status >= 500) return `e-Sbírka je dočasně nedostupná (HTTP ${status}).`;
  return popis || `e-Sbírka vrátila chybu HTTP ${status}.`;
}

/** Adresa endpointu nad dokumentem sbírky; staleUrl musí být v cestě celé zakódované (%2Fsb%2F2012%2F89). */
export function documentUrl(base, stale, suffix = "", params = {}) {
  const url = new URL(`${base}/dokumenty-sbirky/${encodeURIComponent(stale)}${suffix}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  return url.toString();
}

async function request(url, { apiKey = "", signal, fetchImpl = fetch } = {}) {
  const headers = { Accept: "application/json" };
  if (apiKey) headers["esel-api-access-key"] = apiKey;
  let response;
  try {
    response = await fetchImpl(url, { headers, signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new EsbirkaError("e-Sbírka neodpovídá – zkontrolujte připojení k internetu.");
  }
  if (response.ok) return response.json();

  let code = "";
  let popis = "";
  try {
    const [first] = (await response.json())?.chyby ?? [];
    code = first?.kod ?? "";
    popis = first?.popis ?? "";
  } catch {
    // Tělo chyby není JSON – stačí stavový kód.
  }
  throw new EsbirkaError(describe(response.status, code, popis), { status: response.status, code });
}

const isoDate = (date) => date.toISOString().slice(0, 10);

/** Rozdělí úplnou citaci „Zákon č. 89/2012 Sb., občanský zákoník“ na druh a název. */
export function splitCitation(citation) {
  const m = /^(.*?)\s*č\.\s*\d+\s*\/\s*\d{4}\s*Sb\.(?:\s*m\.\s*s\.)?\s*,?\s*(.*)$/su.exec(citation ?? "");
  if (!m) return { type: "", name: (citation ?? "").trim() };
  return { type: m[1].trim(), name: m[2].trim() };
}

/** Z metadat znění vybere, co ukazujeme v okně. */
export function parseLaw(data, today = new Date()) {
  const citation = data?.uplnaCitace ?? "";
  const repealedOn = data?.datumZruseni ? String(data.datumZruseni).slice(0, 10) : null;
  return {
    found: true,
    citation,
    ...splitCitation(citation),
    repealed: !!repealedOn && repealedOn <= isoDate(today),
    repealedOn,
    neverEffective: !!data?.nikdyNebylUcinny,
    staleUrl: data?.staleUrl ?? null,
  };
}

/** Metadata předpisu (aktuální znění). Nenalezený předpis vrací { found: false }. */
export async function fetchLaw(law, { base, ...options }) {
  try {
    return parseLaw(await request(documentUrl(base, staleUrl(law)), options));
  } catch (err) {
    if (err instanceof EsbirkaError && err.notFound) return { found: false };
    throw err;
  }
}

const compact = (s) => (s ?? "").replace(/\s+/g, "").toLowerCase();

/** Dotaz pro nabídku ustanovení: „§ 2079“, „čl. 10“ (odstavce a písmena se neověřují). */
export function provisionQuery(provision) {
  return `${provision.kind === "cl" ? "čl." : "§"} ${provision.num}`;
}

/**
 * Najde ustanovení v aktuálním znění předpisu a vrátí jeho název.
 * { found: true, name } | { found: false } | { found: null } (nabídka ustanovení nic jednoznačného nevrátila).
 */
export async function fetchProvision(stale, provision, { base, ...options }) {
  const query = provisionQuery(provision);
  let data;
  try {
    data = await request(documentUrl(base, stale, "/nabidka-ustanoveni", { text: query, maxPocet: 5 }), options);
  } catch (err) {
    if (err instanceof EsbirkaError && err.notFound) return { found: false };
    throw err;
  }
  const offers = data?.fragmentyNabidky ?? [];
  if (!offers.length) return { found: false };
  const wanted = compact(query);
  const match = offers.find((o) => {
    const id = compact(o.identifikaceUstanoveni);
    return id === wanted || (id.startsWith(wanted) && !/[\p{L}\d]/u.test(id[wanted.length]));
  });
  if (!match) return { found: null };
  const name = (match.nazev ?? "").trim();
  return { found: true, name: compact(name) === wanted ? "" : name };
}
