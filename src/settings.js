// Nastavení rozšíření (ukládají se jen lokálně v prohlížeči).

// Odkud se předpisy ověřují.
export const SOURCES = [
  { id: "api", label: "Oficiální REST API – s API klíčem od MV ČR" },
  { id: "cache", label: "Veřejná cache portálu – bez klíče, neoficiální" },
  { id: "off", label: "Neověřovat – jen odkazy" },
];

// Kam se otevírají odkazy z okna rozšíření.
export const OPEN_IN = [
  { id: "tab", label: "Nová karta – vedle aktuální stránky" },
  { id: "window", label: "Nové okno – samostatné okno prohlížeče" },
];

export const DEFAULTS = {
  source: "api",
  apiKey: "",
  checkProvisions: true,
  openIn: "tab",
};

/**
 * Jak se budou předpisy ověřovat: „api“ (s klíčem), „cache“ (veřejná cache portálu),
 * „off“ (vypnuto), nebo „missing-key“ (zvolené API, ale chybí klíč).
 */
export function verificationMode(settings) {
  if (settings.source === "off") return "off";
  if (settings.source === "cache") return "cache";
  return settings.apiKey?.trim() ? "api" : "missing-key";
}

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
}
