// Static football data — will be replaced by live API data once key is set
// Competitions: EPL, La Liga, Serie A, Bundesliga, Ligue 1, UCL

export const FOOTBALL_COMPETITIONS = [
  { id: "PL",  name: "Premier League",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3D195B" },
  { id: "PD",  name: "La Liga",          flag: "🇪🇸", color: "#EE3340" },
  { id: "SA",  name: "Serie A",          flag: "🇮🇹", color: "#003580" },
  { id: "BL1", name: "Bundesliga",       flag: "🇩🇪", color: "#D3010C" },
  { id: "FL1", name: "Ligue 1",          flag: "🇫🇷", color: "#002395" },
  { id: "CL",  name: "Champions League", flag: "🏆",  color: "#001D5E" },
];

// Fallback static standings (shown while API loads or if key not set)
export const EPL_STANDINGS_STATIC = [
  { pos: 1,  team: "Liverpool",          p: 34, w: 24, d: 5,  l: 5,  pts: 77, gd: "+52", color: "#C8102E" },
  { pos: 2,  team: "Arsenal",            p: 34, w: 22, d: 6,  l: 6,  pts: 72, gd: "+38", color: "#EF0107" },
  { pos: 3,  team: "Chelsea",            p: 34, w: 20, d: 8,  l: 6,  pts: 68, gd: "+29", color: "#034694" },
  { pos: 4,  team: "Nottm Forest",       p: 34, w: 18, d: 8,  l: 8,  pts: 62, gd: "+14", color: "#CC0000" },
  { pos: 5,  team: "Man City",           p: 34, w: 17, d: 8,  l: 9,  pts: 59, gd: "+21", color: "#6CABDD" },
  { pos: 6,  team: "Newcastle",          p: 34, w: 16, d: 7,  l: 11, pts: 55, gd: "+11", color: "#241F20" },
  { pos: 7,  team: "Aston Villa",        p: 34, w: 14, d: 9,  l: 11, pts: 51, gd: "+8",  color: "#95BFE5" },
  { pos: 8,  team: "Tottenham",          p: 34, w: 13, d: 8,  l: 13, pts: 47, gd: "+2",  color: "#132257" },
  { pos: 9,  team: "Man United",         p: 34, w: 12, d: 7,  l: 15, pts: 43, gd: "-8",  color: "#DA291C" },
  { pos: 10, team: "Brighton",           p: 34, w: 11, d: 9,  l: 14, pts: 42, gd: "+1",  color: "#0057B8" },
];

export const LA_LIGA_STATIC = [
  { pos: 1, team: "Barcelona",     p: 32, w: 23, d: 4,  l: 5,  pts: 73, gd: "+48", color: "#A50044" },
  { pos: 2, team: "Real Madrid",   p: 32, w: 21, d: 5,  l: 6,  pts: 68, gd: "+41", color: "#FEBE10" },
  { pos: 3, team: "Atletico",      p: 32, w: 20, d: 6,  l: 6,  pts: 66, gd: "+28", color: "#CB3524" },
  { pos: 4, team: "Athletic Club", p: 32, w: 17, d: 7,  l: 8,  pts: 58, gd: "+18", color: "#CC0000" },
  { pos: 5, team: "Villarreal",    p: 32, w: 15, d: 8,  l: 9,  pts: 53, gd: "+12", color: "#FFD700" },
  { pos: 6, team: "Real Sociedad", p: 32, w: 13, d: 9,  l: 10, pts: 48, gd: "+4",  color: "#003580" },
];

export const SERIE_A_STATIC = [
  { pos: 1, team: "Napoli",     p: 33, w: 22, d: 6,  l: 5,  pts: 72, gd: "+33", color: "#003580" },
  { pos: 2, team: "Inter",      p: 33, w: 21, d: 7,  l: 5,  pts: 70, gd: "+38", color: "#010E80" },
  { pos: 3, team: "Juventus",   p: 33, w: 19, d: 8,  l: 6,  pts: 65, gd: "+22", color: "#000000" },
  { pos: 4, team: "AC Milan",   p: 33, w: 18, d: 7,  l: 8,  pts: 61, gd: "+19", color: "#FB090B" },
  { pos: 5, team: "Atalanta",   p: 33, w: 17, d: 6,  l: 10, pts: 57, gd: "+28", color: "#1E50AE" },
  { pos: 6, team: "Fiorentina", p: 33, w: 14, d: 8,  l: 11, pts: 50, gd: "+6",  color: "#4B0082" },
];

export const BUNDESLIGA_STATIC = [
  { pos: 1, team: "Bayern Munich",    p: 30, w: 22, d: 3,  l: 5,  pts: 69, gd: "+52", color: "#DC052D" },
  { pos: 2, team: "Bayer Leverkusen", p: 30, w: 19, d: 6,  l: 5,  pts: 63, gd: "+38", color: "#E32221" },
  { pos: 3, team: "Borussia Dortmund",p: 30, w: 17, d: 5,  l: 8,  pts: 56, gd: "+22", color: "#FDE100" },
  { pos: 4, team: "RB Leipzig",       p: 30, w: 16, d: 6,  l: 8,  pts: 54, gd: "+18", color: "#DD0741" },
  { pos: 5, team: "Eintracht",        p: 30, w: 14, d: 5,  l: 11, pts: 47, gd: "+8",  color: "#E2001A" },
  { pos: 6, team: "Freiburg",         p: 30, w: 12, d: 7,  l: 11, pts: 43, gd: "-2",  color: "#CC0000" },
];

export const UCL_LAST16 = [
  { home: "Real Madrid",   homeScore: 3, awayScore: 1, away: "Man City",       date: "Mar 5",  stage: "R16 1st Leg" },
  { home: "Barcelona",     homeScore: 2, awayScore: 0, away: "PSG",            date: "Mar 5",  stage: "R16 1st Leg" },
  { home: "Bayern Munich", homeScore: 2, awayScore: 2, away: "Inter",          date: "Mar 5",  stage: "R16 1st Leg" },
  { home: "Arsenal",       homeScore: 3, awayScore: 0, away: "Sporting CP",    date: "Mar 5",  stage: "R16 1st Leg" },
  { home: "Liverpool",     homeScore: 2, awayScore: 1, away: "Juventus",       date: "Mar 12", stage: "R16 2nd Leg" },
  { home: "Atletico",      homeScore: 1, awayScore: 0, away: "Bayer Leverkusen", date: "Mar 12", stage: "R16 2nd Leg" },
];
