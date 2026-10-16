# Changelog

Všechny podstatné změny rozšíření **Paragrafy – odkazy na zákony** jsou zapsané v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/)
a projekt používá [sémantické verzování](https://semver.org/lang/cs/).

## [Unreleased]

## [0.1.0] – 2026-10-16

### Přidáno
- První verze rozšíření. Po kliknutí na ikonu najde na stránce citace českých předpisů – číslem
  („§ 2079 odst. 2 zákona č. 89/2012 Sb.“), názvem ve všech pádech („zákoníku práce“) i ustálenou
  zkratkou („§ 68 s. ř. s.“, „§ 2079 OZ“) – a vypíše je v okně s odkazy přímo na předpis
  a na jednotlivé paragrafy a články v e-Sbírce.
- Ověření přes REST API e-Sbírky: úplný název předpisu, štítek *zrušen* u zrušených a *nenalezen*
  u neexistujících předpisů, názvy paragrafů a upozornění na paragraf, který v aktuálním znění není.
  Zdroj dat: oficiální API s klíčem (hlavička `esel-api-access-key`), veřejná cache portálu bez klíče,
  nebo bez ověření.
- Odkazy se otevírají v nové kartě nebo v novém okně; Ctrl + klik a kolečko myši otevře odkaz
  na pozadí, Shift + klik v novém okně.
- Tlačítko **Kopírovat** zkopíruje seznam předpisů a paragrafů s odkazy.
- Stránka nastavení ve stejném designu jako Shrnu.to, s tlačítkem **Vyzkoušet** pro ověření
  spojení s e-Sbírkou.

[Unreleased]: https://github.com/petrkrapek/PORTAL/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/petrkrapek/PORTAL/releases/tag/v0.1.0
