export function getCountries() {
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const excludedRegions = new Set(["EU", "EZ", "QO", "UN", "XA", "XB", "ZZ"]);
  const countries = [];

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      if (excludedRegions.has(code)) continue;

      const name = displayNames.of(code);
      if (!name || name === code) continue;

      const flag = String.fromCodePoint(...[...code].map((letter) => letter.codePointAt(0) + 127397));
      countries.push({ name, flag });
    }
  }

  return countries.sort((left, right) => left.name.localeCompare(right.name, "en"));
}
