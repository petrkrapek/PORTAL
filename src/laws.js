// Často citované předpisy, které se na stránkách objevují jen názvem („podle zákoníku práce“)
// nebo zkratkou za paragrafem („§ 2079 OZ“). Předpisy citované číslem („č. 89/2012 Sb.“)
// se poznají i bez tohoto seznamu – slouží jen k doplnění čísla a názvu před ověřením v e-Sbírce.
//
// Zápis názvů a zkratek (slova oddělená mezerou):
//   slovo*   kmen + libovolná koncovka (pády): „občansk* zákoník*“
//   zákon~   „zákon“ ve všech pádech
//   …(…)…   slovo se závorkou je regulární výraz beze změny: „Ústav(?:a|y|ě|u|ou)“
// Názvy se hledají bez ohledu na velikost písmen, zkratky přesně.

const law = (key, type, name, names = [], abbrs = []) => ({ key, type, name, names, abbrs });

export const KNOWN_LAWS = [
  law(
    "sb/1993/1",
    "Ústavní zákon",
    "Ústava České republiky",
    ["Ústav(?:a|y|ě|u|ou) České republiky", "Ústav(?:a|y|ě|u|ou) ČR"],
    ["Ústav(?:a|y|ě|u|ou)"],
  ),
  law(
    "sb/1993/2",
    "Usnesení",
    "Listina základních práv a svobod",
    ["Listin* základních práv a svobod"],
    ["Listin*", "LZPS"],
  ),
  law("sb/2012/89", "Zákon", "občanský zákoník", ["občansk* zákoník*"], ["NOZ", "OZ", "ObčZ", "obč. zák.", "o. z."]),
  law(
    "sb/2012/90",
    "Zákon",
    "zákon o obchodních korporacích",
    ["zákon~ o obchodních korporacích"],
    ["ZOK", "z. o. k."],
  ),
  law("sb/1991/513", "Zákon", "obchodní zákoník", ["obchodn* zákoník*"], ["ObchZ", "ObZ", "obch. zák."]),
  law("sb/2006/262", "Zákon", "zákoník práce", ["zákoník* práce"], ["ZP", "zák. práce"]),
  law("sb/2009/40", "Zákon", "trestní zákoník", ["trestn* zákoník*"], ["TZ", "TrZ", "tr. zákoníku", "tr. zák."]),
  law("sb/1961/141", "Zákon", "trestní řád", ["trestn* řád*"], ["TŘ", "tr. ř."]),
  law("sb/1963/99", "Zákon", "občanský soudní řád", ["občansk* soudn* řád*"], ["OSŘ", "o. s. ř."]),
  law(
    "sb/2012/292",
    "Zákon",
    "zákon o zvláštních řízeních soudních",
    ["zákon~ o zvláštních řízeních soudních"],
    ["ZŘS", "z. ř. s."],
  ),
  law("sb/2002/150", "Zákon", "soudní řád správní", ["soudn* řád* správn*"], ["SŘS", "s. ř. s."]),
  law("sb/2004/500", "Zákon", "správní řád", ["správn* řád*"], ["SŘ", "spr. ř.", "s. ř."]),
  law("sb/2009/280", "Zákon", "daňový řád", ["daňov* řád*"], ["DŘ", "daň. ř."]),
  law("sb/2001/120", "Zákon", "exekuční řád", ["exekučn* řád*"], ["EŘ", "ex. ř."]),
  law("sb/1992/358", "Zákon", "notářský řád", ["notářsk* řád*"], ["NŘ", "not. ř."]),
  law("sb/2012/255", "Zákon", "kontrolní řád", ["kontroln* řád*"], ["KŘ", "kontr. ř."]),
  law("sb/2006/182", "Zákon", "insolvenční zákon", ["insolvenčn* zákon*"], ["InsZ", "IZ", "insolv. zák."]),
  law("sb/2016/134", "Zákon", "zákon o zadávání veřejných zakázek", ["zákon~ o zadávání veřejných zakázek"], ["ZZVZ"]),
  law("sb/2019/110", "Zákon", "zákon o zpracování osobních údajů", ["zákon~ o zpracování osobních údajů"], ["ZZOÚ"]),
  law("sb/2000/101", "Zákon", "zákon o ochraně osobních údajů", ["zákon~ o ochraně osobních údajů"], ["ZOOÚ"]),
  law(
    "sb/1999/106",
    "Zákon",
    "zákon o svobodném přístupu k informacím",
    ["zákon~ o svobodném přístupu k informacím"],
    ["InfZ"],
  ),
  law(
    "sb/2004/235",
    "Zákon",
    "zákon o dani z přidané hodnoty",
    ["zákon~ o dani z přidané hodnoty", "zákon~ o DPH"],
    ["ZDPH"],
  ),
  law("sb/1992/586", "Zákon", "zákon o daních z příjmů", ["zákon~ o daních z příjmů"], ["ZDP"]),
  law("sb/1991/563", "Zákon", "zákon o účetnictví", ["zákon~ o účetnictví"], ["ZoÚ"]),
  law("sb/1991/455", "Zákon", "živnostenský zákon", ["živnostensk* zákon*"], ["ŽZ", "živn. zák."]),
  law("sb/2000/121", "Zákon", "autorský zákon", ["autorsk* zákon*"], ["AZ", "aut. zák."]),
  law(
    "sb/2016/250",
    "Zákon",
    "zákon o odpovědnosti za přestupky a řízení o nich",
    ["zákon~ o odpovědnosti za přestupky"],
    ["ZOP"],
  ),
  law(
    "sb/2000/361",
    "Zákon",
    "zákon o silničním provozu",
    ["zákon~ o silničním provozu", "zákon~ o provozu na pozemních komunikacích"],
    ["ZSP"],
  ),
  law("sb/2000/128", "Zákon", "zákon o obcích", ["zákon~ o obcích", "obecn* zřízení"]),
  law("sb/2000/129", "Zákon", "zákon o krajích", ["zákon~ o krajích", "krajsk* zřízení"]),
  law("sb/2000/131", "Zákon", "zákon o hlavním městě Praze", ["zákon~ o hlavním městě Praze"]),
  law("sb/2021/283", "Zákon", "stavební zákon", ["stavebn* zákon*"], ["SZ", "stav. zák."]),
  law("sb/2013/256", "Zákon", "katastrální zákon", ["katastráln* zákon*", "zákon~ o katastru nemovitostí"], ["KatZ"]),
  law("sb/2011/372", "Zákon", "zákon o zdravotních službách", ["zákon~ o zdravotních službách"], ["ZZS"]),
  law(
    "sb/2011/373",
    "Zákon",
    "zákon o specifických zdravotních službách",
    ["zákon~ o specifických zdravotních službách"],
    ["ZSZS"],
  ),
  law("sb/2011/374", "Zákon", "zákon o zdravotnické záchranné službě", ["zákon~ o zdravotnické záchranné službě"]),
  law(
    "sb/1997/48",
    "Zákon",
    "zákon o veřejném zdravotním pojištění",
    ["zákon~ o veřejném zdravotním pojištění"],
    ["ZVZP"],
  ),
  law("sb/2007/378", "Zákon", "zákon o léčivech", ["zákon~ o léčivech"]),
  law("sb/2000/258", "Zákon", "zákon o ochraně veřejného zdraví", ["zákon~ o ochraně veřejného zdraví"], ["ZOVZ"]),
  law("sb/2004/96", "Zákon", "zákon o nelékařských zdravotnických povoláních", [
    "zákon~ o nelékařských zdravotnických povoláních",
  ]),
  law("sb/2021/325", "Zákon", "zákon o elektronizaci zdravotnictví", ["zákon~ o elektronizaci zdravotnictví"]),
  law("sb/2022/375", "Zákon", "zákon o zdravotnických prostředcích", ["zákon~ o zdravotnických prostředcích"]),
  law("sb/2006/108", "Zákon", "zákon o sociálních službách", ["zákon~ o sociálních službách"], ["ZSS"]),
  law("sb/2006/187", "Zákon", "zákon o nemocenském pojištění", ["zákon~ o nemocenském pojištění"], ["ZNP"]),
  law("sb/1995/155", "Zákon", "zákon o důchodovém pojištění", ["zákon~ o důchodovém pojištění"]),
  law("sb/2004/435", "Zákon", "zákon o zaměstnanosti", ["zákon~ o zaměstnanosti"]),
  law("sb/2004/561", "Zákon", "školský zákon", ["školsk* zákon*"], ["ŠZ"]),
  law("sb/1998/111", "Zákon", "zákon o vysokých školách", ["zákon~ o vysokých školách"], ["ZVŠ"]),
  law("sb/2014/234", "Zákon", "zákon o státní službě", ["zákon~ o státní službě"]),
  law("sb/2006/159", "Zákon", "zákon o střetu zájmů", ["zákon~ o střetu zájmů"]),
  law("sb/2015/340", "Zákon", "zákon o registru smluv", ["zákon~ o registru smluv"], ["ZRS"]),
  law(
    "sb/2000/365",
    "Zákon",
    "zákon o informačních systémech veřejné správy",
    ["zákon~ o informačních systémech veřejné správy"],
    ["ZISVS"],
  ),
  law("sb/2009/111", "Zákon", "zákon o základních registrech", ["zákon~ o základních registrech"], ["ZZR"]),
  law("sb/2008/300", "Zákon", "zákon o elektronických úkonech a autorizované konverzi dokumentů", [
    "zákon~ o elektronických úkonech",
  ]),
  law("sb/2020/12", "Zákon", "zákon o právu na digitální služby", ["zákon~ o právu na digitální služby"], ["ZPDS"]),
  law("sb/2016/297", "Zákon", "zákon o službách vytvářejících důvěru pro elektronické transakce", [
    "zákon~ o službách vytvářejících důvěru",
  ]),
  law("sb/2005/127", "Zákon", "zákon o elektronických komunikacích", ["zákon~ o elektronických komunikacích"], ["ZEK"]),
  law("sb/1992/634", "Zákon", "zákon o ochraně spotřebitele", ["zákon~ o ochraně spotřebitele"], ["ZOS"]),
  law(
    "sb/2001/143",
    "Zákon",
    "zákon o ochraně hospodářské soutěže",
    ["zákon~ o ochraně hospodářské soutěže"],
    ["ZOHS"],
  ),
  law("sb/2004/499", "Zákon", "zákon o archivnictví a spisové službě", ["zákon~ o archivnictví"]),
  law("sb/2000/218", "Zákon", "rozpočtová pravidla", ["rozpočtov* pravidl*", "zákon~ o rozpočtových pravidlech"]),
  law("sb/2013/304", "Zákon", "zákon o veřejných rejstřících", ["zákon~ o veřejných rejstřících"], ["ZVR"]),
  law("sb/1996/85", "Zákon", "zákon o advokacii", ["zákon~ o advokacii"]),
  law("sb/2002/6", "Zákon", "zákon o soudech a soudcích", ["zákon~ o soudech a soudcích"]),
  law("sb/2008/273", "Zákon", "zákon o Policii České republiky", ["zákon~ o Policii České republiky"]),
  law("sb/1999/326", "Zákon", "zákon o pobytu cizinců", ["zákon~ o pobytu cizinců"], ["ZPC"]),
  law("sb/2020/541", "Zákon", "zákon o odpadech", ["zákon~ o odpadech"]),
  law("sb/2001/254", "Zákon", "vodní zákon", ["vodn* zákon*"]),
  law("sb/1992/114", "Zákon", "zákon o ochraně přírody a krajiny", ["zákon~ o ochraně přírody a krajiny"], ["ZOPK"]),
  law("sb/1995/289", "Zákon", "lesní zákon", ["lesn* zákon*"]),
  law("sb/2000/458", "Zákon", "energetický zákon", ["energetick* zákon*"], ["EZ"]),
  law("sb/2017/370", "Zákon", "zákon o platebním styku", ["zákon~ o platebním styku"], ["ZPS"]),
  law("sb/1992/21", "Zákon", "zákon o bankách", ["zákon~ o bankách"]),
];

const BY_KEY = new Map(KNOWN_LAWS.map((l) => [l.key, l]));

/** Známý předpis podle klíče „sb/2012/89“ (nebo undefined). */
export function knownLaw(key) {
  return BY_KEY.get(key);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function token(word) {
  if (word.includes("(")) return word;
  if (word.endsWith("*")) return `${escape(word.slice(0, -1))}\\p{L}*`;
  if (word.endsWith("~")) return `${escape(word.slice(0, -1))}(?:a|u|em|ě|y|ů|ům|ech)?`;
  return escape(word);
}

/** Regulární výraz (zdroj) pro název nebo zkratku v zápisu popsaném nahoře. */
export function patternSource(pattern, { abbreviation = false } = {}) {
  // Zkratky s tečkami se píšou s mezerami i bez nich („o. s. ř.“ i „o.s.ř.“).
  const glue = abbreviation ? "\\s*" : "\\s+";
  const body = pattern.split(" ").map(token).join(glue);
  // Konec: za tečkou už slovo skončilo, jinak nesmí následovat další písmeno.
  return `(?<!\\p{L})${body}${pattern.endsWith(".") ? "" : "(?!\\p{L})"}`;
}
