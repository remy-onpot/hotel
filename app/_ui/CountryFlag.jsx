export default function CountryFlag({ countryFlag, nationality }) {
  if (!countryFlag) return null;

  const label = `${nationality || "Country"} flag`;
  if (/^https?:\/\//i.test(countryFlag)) {
    return <img src={countryFlag} alt={label} />;
  }

  return <span role="img" aria-label={label}>{countryFlag}</span>;
}
