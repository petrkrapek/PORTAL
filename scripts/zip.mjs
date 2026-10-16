// Zabalí složku extension/ do ZIPu pro Chrome Web Store (manifest.json v kořeni archivu).
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, rmSync } from "node:fs";

const { version } = JSON.parse(readFileSync("extension/manifest.json", "utf8"));
const out = `release/paragrafy-${version}.zip`;
mkdirSync("release", { recursive: true });
rmSync(out, { force: true });
execFileSync("zip", ["-r", "-X", `../${out}`, ".", "-x", ".*", "*/.*"], { cwd: "extension", stdio: "inherit" });
console.log(`Hotovo: ${out}`);
