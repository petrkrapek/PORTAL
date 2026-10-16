// Vykreslí ikony rozšíření (bílý paragraf na terakotovém čtverci, stejný styl jako Shrnu.to).
// Potřebuje ImageMagick (convert) a písmo DejaVu Sans; hotové PNG jsou v repozitáři.
import { execFileSync } from "node:child_process";

const SIZE = 512;
const master = "extension/icons/icon512.png";
execFileSync("convert", [
  "-size",
  `${SIZE}x${SIZE}`,
  "xc:none",
  "-fill",
  "#c15f3c",
  "-draw",
  `roundrectangle 16,16 ${SIZE - 17},${SIZE - 17} 96,96`,
  "-font",
  "DejaVu-Sans-Bold",
  "-pointsize",
  "340",
  "-fill",
  "#ffffff",
  "-gravity",
  "center",
  "-annotate",
  "+0+10",
  "§",
  master,
]);
for (const size of [16, 32, 48, 128]) {
  execFileSync("convert", [master, "-resize", `${size}x${size}`, `extension/icons/icon${size}.png`]);
}
execFileSync("rm", [master]);
console.log("Hotovo: extension/icons/icon{16,32,48,128}.png");
