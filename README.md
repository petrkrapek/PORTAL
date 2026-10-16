# Paragrafy – odkazy na zákony

[![CI](https://github.com/petrkrapek/PORTAL/actions/workflows/ci.yml/badge.svg)](https://github.com/petrkrapek/PORTAL/actions/workflows/ci.yml)
[![Licence](https://img.shields.io/badge/licence-Apache--2.0-blue)](LICENSE)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)

Rozšíření do Google Chrome, které na otevřené stránce najde citace českých zákonů a jejich paragrafů
a v malém okně nabídne odkazy přímo na dané ustanovení v [e-Sbírce](https://e-sbirka.gov.cz/).
Nalezené předpisy ověří přes [REST API e-Sbírky](https://e-sbirka.gov.cz/restful-api): doplní úplný
název, upozorní na zrušené předpisy a chybné citace a dohledá názvy paragrafů.

Design okna i nastavení vychází z rozšíření [Shrnu.to](https://github.com/petrkrapek/SULWE).

**Aktuální verze:** 0.1.0 · historie změn v [CHANGELOG.md](CHANGELOG.md)

## Funkce

| Funkce | Popis | Potřebujete |
|---|---|---|
| **Citace na stránce** | najde předpisy citované číslem, názvem i zkratkou a jejich paragrafy a články | nic |
| **Prokliky do e-Sbírky** | každý předpis i paragraf je odkaz přímo na místo v textu zákona (nová karta nebo nové okno) | nic |
| **Ověření předpisů** | úplný název, štítek *zrušen* / *nenalezen*, názvy paragrafů | API klíč e-Sbírky (nebo veřejná cache) |
| **Kopírovat** | seznam předpisů a paragrafů s odkazy do schránky | nic |

## Instalace

1. Stáhněte repozitář (**Code → Download ZIP**) a rozbalte ho.
2. V Chromu otevřete `chrome://extensions` a vpravo nahoře zapněte **Režim pro vývojáře**.
3. Klikněte na **Načíst rozbalené** a vyberte složku `extension` (tu, ve které je `manifest.json`).
4. Ikonu § si připněte na lištu (ikona puzzle → špendlík).

Po instalaci se samo otevře nastavení. Po stažení nové verze klikněte v `chrome://extensions`
u rozšíření na ikonu obnovení – nastavení i klíč zůstanou zachované.

## Okno rozšíření

```
┌──────────────────────────────────────────┐
│ Název stránky                          ⚙ │
│ 3 předpisy · 5 ustanovení · ověřeno      │  ← počty a stav ověření
├──────────────────────────────────────────┤
│ ● Zákon č. 262/2006 Sb.                ↗ │  ← odkaz na celý zákon
│   zákoník práce                          │
│   § 52 písm. c)  Výpověď               ↗ │  ← odkaz přímo na paragraf
│   § 55 odst. 1   Okamžité zrušení…     ↗ │
│ ● Zákon č. 513/1991 Sb.     zrušen     ↗ │
│   obchodní zákoník                       │
│   § 409                                ↗ │
├──────────────────────────────────────────┤
│ Ctrl + klik na pozadí  [Kopírovat][Znovu]│
└──────────────────────────────────────────┘
```

- **Klik** otevře zákon nebo paragraf v nové kartě (nebo v novém okně podle nastavení).
- **Ctrl + klik** (⌘ + klik) nebo **kolečko myši** otevře odkaz na pozadí a okno zůstane otevřené;
  **Shift + klik** otevře nové okno.
- Barevná tečka: zelená = ověřeno, červená = předpis je zrušený, žlutá = předpis v e-Sbírce není
  (nejspíš překlep v citaci). Přeškrtnutý paragraf v aktuálním znění předpisu není.
- **Znovu** projde stránku znovu (třeba po načtení dalšího obsahu).

## Co rozšíření rozpozná

| Zápis na stránce | Příklad |
|---|---|
| číslem předpisu | `§ 2079 odst. 2 zákona č. 89/2012 Sb.`, `vyhláška č. 123/2018 Sb.`, `č. 209/1992 Sb. m. s.` |
| názvem (ve všech pádech) | `§ 52 písm. c) zákoníku práce`, `podle zákona o zdravotních službách`, `čl. 36 Listiny` |
| ustálenou zkratkou za paragrafem | `§ 2079 OZ`, `§ 68 odst. 3 s. ř. s.`, `§ 114 o.s.ř.`, `§ 33 ZZVZ` |
| výčty a rozsahy | `§ 5, 6 a 8`, `§§ 10 až 12`, `§ 2079 a násl.` |
| odkaz na předchozí předpis | `§ 5 téhož zákona`, `§ 7 citovaného zákona` |

- Paragraf bez uvedeného předpisu se přiřadí k zákonu zmíněnému těsně před ním (do 400 znaků).
  Když ho přiřadit nejde, okno ho jen započítá („2 další ustanovení bez určeného předpisu“).
- Ustanovení předpisů EU a mezinárodních smluv (`čl. 6 GDPR`, `čl. 101 SFEU`) se přeskakují.
- Názvy a zkratky přes 70 nejčastěji citovaných předpisů jsou v [`src/laws.js`](src/laws.js);
  předpisy citované číslem se poznají vždy.
- Odkaz na paragraf vede na kotvu portálu (`…/sb/2012/89?zalozka=text#par_2079-odst_2`).
  U výčtu odstavců nebo písmen („odst. 1 a 2“, „písm. a) až c)“) vede o úroveň výš, na celý paragraf.

## Ověření v e-Sbírce

V nastavení zvolíte zdroj dat:

| Zdroj | Adresa | Klíč |
|---|---|---|
| **Oficiální REST API** (výchozí) | `https://api.e-sbirka.gov.cz` | hlavička `esel-api-access-key` |
| **Veřejná cache portálu** | `https://e-sbirka.gov.cz/sbr-cache` | není potřeba – neoficiální, bez podpory MV ČR |
| **Neověřovat** | – | jen odkazy, bez dotazů do e-Sbírky |

**Jak získat klíč:** na stránce [Použití REST API](https://e-sbirka.gov.cz/restful-api) stáhněte
registrační formulář a pošlete ho datovou schránkou Ministerstvu vnitra. Přidělený klíč vložte
do nastavení a tlačítkem **Vyzkoušet** ověřte spojení (zkušební dotaz na Ústavu, 1/1993 Sb.).
Bez klíče rozšíření funguje dál – odkazy jsou platné, jen se neověřují.

Použité endpointy (staleUrl je v cestě celé zakódované, např. `%2Fsb%2F2012%2F89`):

- `GET /dokumenty-sbirky/{staleUrl}` – úplná citace (`uplnaCitace`), datum zrušení, aktuální znění;
  `DOKUMENT_NENALEZEN` → štítek *nenalezen*.
- `GET /dokumenty-sbirky/{staleUrl}/nabidka-ustanoveni?text=§ 2079` – název paragrafu a jeho
  existence v aktuálním znění (jen při zapnutém **Dohledávat názvy paragrafů**).

Na stránku se ověří nejvýš 30 předpisů a 60 paragrafů, 4 dotazy najednou. Odpovědi se pamatují
do zavření prohlížeče, takže opakované otevření okna nic neposílá.

## Soukromí

- Text stránky se **nikam neodesílá** – citace se hledají přímo v prohlížeči.
- Do e-Sbírky odchází jen čísla nalezených předpisů a paragrafů (a API klíč, je-li zvolený).
- Nastavení a klíč jsou uložené jen lokálně v prohlížeči (`chrome.storage.local`).
- Rozšíření čte stránku jen po kliknutí na ikonu (oprávnění `activeTab`).

## Vývoj

Zdroje jsou v `src/`, rozšíření (HTML, CSS, ikony a sestavený `dist/`) v `extension/`.
Vyžaduje Node.js 22.

```bash
npm install
npm run build      # sestaví extension/dist/ (esbuild)
npm run watch      # průběžné sestavování
npm test           # testy (node --test)
npm run check      # lint + formát + testy + build (totéž co CI)
npm run zip        # balíček release/paragrafy-<verze>.zip
npm run icons      # přegeneruje ikony (ImageMagick)
```

Sestavený `extension/dist/` je v repozitáři, aby šlo rozšíření načíst rovnou ze složky;
CI hlídá, že odpovídá zdrojům.

| Soubor | Co dělá |
|---|---|
| `src/citations.js` | vyhledání citací předpisů a ustanovení v textu |
| `src/laws.js` | názvy a zkratky často citovaných předpisů |
| `src/links.js` | odkazy a kotvy na portálu e-Sbírka |
| `src/esbirka.js` | klient REST API e-Sbírky |
| `src/popup.js` | okno rozšíření |
| `src/options.js` | stránka nastavení |

## Licence

[Apache License 2.0](LICENSE) © 2026 Petr Křápek
