// Flag emoji lookup for World Cup team names.
// "Loser SF1" / "Winner SF2" etc. intentionally have no entry — they're
// placeholders until the actual semifinal results are known.
export const COUNTRY_FLAGS = {
  France: "🇫🇷",
  Spain: "🇪🇸",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Argentina: "🇦🇷",
};

export function flagFor(teamName) {
  return COUNTRY_FLAGS[teamName] || "";
}
