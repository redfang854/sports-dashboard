// Rugby union tables — manually maintained (no working live rugby API on
// the current plan). Bump RUGBY_UPDATED whenever figures change; the page
// shows it and flags it after 60 days.
// Sources (Wikipedia, revisions of 27–30 Oct 2026): "2026 Six Nations
// Championship" (final), "2026–27 United Rugby Championship" and
// "2026–27 Premiership Rugby" (in progress).

export const RUGBY_UPDATED = "2026-10-30";
export const RUGBY_SOURCE = "Six Nations, URC and Premiership tables via Wikipedia";

export const SIX_NATIONS_2026 = [
  { pos: 1, team: "France", flag: "🇫🇷", p: 5, w: 4, d: 0, l: 1, gd: "+81", pts: 21, color: "#002395" },
  { pos: 2, team: "Ireland", flag: "🇮🇪", p: 5, w: 4, d: 0, l: 1, gd: "+38", pts: 19, color: "#169B62" },
  { pos: 3, team: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", p: 5, w: 3, d: 0, l: 2, gd: "−1", pts: 16, color: "#003580" },
  { pos: 4, team: "Italy", flag: "🇮🇹", p: 5, w: 2, d: 0, l: 3, gd: "−38", pts: 9, color: "#009246" },
  { pos: 5, team: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 5, w: 1, d: 0, l: 4, gd: "+2", pts: 8, color: "#E8E8E8" },
  { pos: 6, team: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p: 5, w: 1, d: 0, l: 4, gd: "−82", pts: 6, color: "#D01010" },
];

export const URC_STANDINGS_2026_27 = [
  { pos: 1, team: "Glasgow Warriors", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", p: 5, w: 4, d: 1, l: 0, gd: "+36", pts: 23, color: "#02A9CE" },
  { pos: 2, team: "Edinburgh", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", p: 4, w: 4, d: 0, l: 0, gd: "+47", pts: 19, color: "#B22234" },
  { pos: 3, team: "Leinster", flag: "🇮🇪", p: 5, w: 3, d: 0, l: 2, gd: "+68", pts: 18, color: "#003082" },
  { pos: 4, team: "Bulls", flag: "🇿🇦", p: 4, w: 3, d: 0, l: 1, gd: "+70", pts: 16, color: "#0057B8" },
  { pos: 5, team: "Stormers", flag: "🇿🇦", p: 4, w: 3, d: 0, l: 1, gd: "+39", pts: 16, color: "#0072C6" },
  { pos: 6, team: "Sharks", flag: "🇿🇦", p: 4, w: 3, d: 0, l: 1, gd: "+21", pts: 15, color: "#000000" },
  { pos: 7, team: "Ospreys", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p: 4, w: 2, d: 0, l: 2, gd: "−9", pts: 11, color: "#6E6E6E" },
  { pos: 8, team: "Connacht", flag: "🇮🇪", p: 5, w: 2, d: 0, l: 3, gd: "−52", pts: 10, color: "#0B7A3E" },
  { pos: 9, team: "Munster", flag: "🇮🇪", p: 4, w: 1, d: 1, l: 2, gd: "−8", pts: 10, color: "#CC0000" },
  { pos: 10, team: "Cardiff", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p: 4, w: 2, d: 0, l: 2, gd: "−20", pts: 9, color: "#00A3E0" },
  { pos: 11, team: "Lions", flag: "🇿🇦", p: 5, w: 2, d: 0, l: 3, gd: "−55", pts: 9, color: "#C8102E" },
  { pos: 12, team: "Ulster", flag: "🇮🇪", p: 4, w: 0, d: 2, l: 2, gd: "−13", pts: 9, color: "#E4002B" },
  { pos: 13, team: "Dragons", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p: 4, w: 1, d: 1, l: 2, gd: "−12", pts: 9, color: "#C8102E" },
  { pos: 14, team: "Scarlets", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p: 4, w: 1, d: 0, l: 3, gd: "−29", pts: 8, color: "#B4001E" },
  { pos: 15, team: "Benetton", flag: "🇮🇹", p: 4, w: 0, d: 1, l: 3, gd: "−8", pts: 6, color: "#0B6E3E" },
  { pos: 16, team: "Zebre", flag: "🇮🇹", p: 4, w: 0, d: 0, l: 4, gd: "−85", pts: 2, color: "#000000" },
];

export const PREMIERSHIP_STANDINGS_2026_27 = [
  { pos: 1, team: "Gloucester", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 3, d: 0, l: 1, gd: "+80", pts: 16, color: "#C8102E" },
  { pos: 2, team: "Leicester Tigers", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 3, d: 0, l: 1, gd: "+31", pts: 16, color: "#0B6E3E" },
  { pos: 3, team: "Bristol Bears", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 3, d: 0, l: 1, gd: "+15", pts: 14, color: "#002F5F" },
  { pos: 4, team: "Northampton Saints", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 2, d: 0, l: 2, gd: "+20", pts: 11, color: "#00573F" },
  { pos: 5, team: "Saracens", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 2, d: 0, l: 2, gd: "+3", pts: 11, color: "#E8E8E8" },
  { pos: 6, team: "Bath", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 2, d: 0, l: 2, gd: "−19", pts: 11, color: "#004B87" },
  { pos: 7, team: "Sale Sharks", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 2, d: 0, l: 2, gd: "−16", pts: 9, color: "#003580" },
  { pos: 8, team: "Newcastle Red Bulls", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 1, d: 0, l: 3, gd: "−30", pts: 8, color: "#DB0A40" },
  { pos: 9, team: "Exeter Chiefs", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 1, d: 0, l: 3, gd: "−34", pts: 8, color: "#000000" },
  { pos: 10, team: "Harlequins", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p: 4, w: 1, d: 0, l: 3, gd: "−50", pts: 7, color: "#00A650" },
];

// Premiership Round 4, 23–25 Oct 2026.
export const RECENT_RUGBY = [
  { home: "Gloucester",          homeScore: 23, awayScore: 5,  away: "Bath",               competition: "Premiership", date: "2026-10-23" },
  { home: "Newcastle Red Bulls", homeScore: 17, awayScore: 3,  away: "Sale Sharks",        competition: "Premiership", date: "2026-10-23" },
  { home: "Leicester Tigers",    homeScore: 28, awayScore: 7,  away: "Northampton Saints", competition: "Premiership", date: "2026-10-24" },
  { home: "Bristol Bears",       homeScore: 20, awayScore: 7,  away: "Exeter Chiefs",      competition: "Premiership", date: "2026-10-24" },
  { home: "Harlequins",          homeScore: 33, awayScore: 15, away: "Saracens",           competition: "Premiership", date: "2026-10-25" },
];
