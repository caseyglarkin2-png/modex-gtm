/** Pure: shared by the cohort opportunity cards and the account brief (a hook never rests on people harmed). */
/** A fact about people harmed (jobs lost, bankruptcy, deaths, a recall, a strike) is never a cold opener's hook. */
const SENSITIVE: Array<[RegExp, string]> = [
  [/\b(?:layoffs?|laid off|job cuts|jobs? (?:cut|lost)|out of work|lo(?:se|st) (?:their|his|her) jobs|furlough\w*|workforce reduction)\b/i, 'people lost their jobs'],
  [/\b(?:bankrupt\w*|chapter 11|insolven\w*)\b/i, 'a bankruptcy'],
  [/\b(?:fatal\w*|died|deaths?|killed)\b/i, 'people died'],
  [/\brecall(?:s|ed)?\b/i, 'a product recall'],
  [/\bstrikes?\b|\bwalkout\b/i, 'a labor dispute'],
];
export function sensitivityOf(quote: string): string | null {
  for (const [re, what] of SENSITIVE) if (re.test(quote)) return what;
  return null;
}
