export const FIGHTERS = {
  topuria: { name: "Ilia Topuria", nationality: "🇬🇪 Georgia", division: "Lightweight Champion", record: { w: 16, l: 0, d: 0 }, age: 27, reach: '70"', finishRate: "81%", lastResult: "TKO — TITLE DEFENCE", bio: "Undefeated lightweight champion and pound-for-pound superstar. Defends his title against Gaethje at UFC Freedom 250 at the White House on June 14." },
  gaethje: { name: "Justin Gaethje", nationality: "🇺🇸 USA", division: "Lightweight", record: { w: 27, l: 4, d: 0 }, age: 35, reach: '70"', finishRate: "74%", lastResult: "Win — Interim Title", bio: "Interim lightweight champion and BMF title holder. Known for relentless forward pressure and devastating low kicks. Faces Topuria for the undisputed title June 14." },
  pereira: { name: "Alex Pereira", nationality: "🇧🇷 Brazil", division: "Light Heavyweight Champion", record: { w: 13, l: 3, d: 0 }, age: 36, reach: '79"', finishRate: "85%", lastResult: "KO — Title Defence", bio: "Two-division champion chasing history. Steps up to heavyweight to face Gane for the interim title. Wins three UFC divisional titles if successful — a first in the sport." },
  gane: { name: "Ciryl Gane", nationality: "🇫🇷 France", division: "Heavyweight", record: { w: 13, l: 2, d: 0 }, age: 34, reach: '84"', finishRate: "54%", lastResult: "Win", bio: "Former interim heavyweight champion and two-time title challenger. Technical striker with elite footwork. Fights Pereira for the interim heavyweight belt at Freedom 250." },
  omalley: { name: "Sean O'Malley", nationality: "🇺🇸 USA", division: "Bantamweight", record: { w: 20, l: 1, d: 0 }, age: 29, reach: '72"', finishRate: "65%", lastResult: "Win", bio: "Fan favourite and former bantamweight champion. Creative striker with elite highlight-reel power. Takes on Zahabi on the Freedom 250 main card." },
  chandler: { name: "Michael Chandler", nationality: "🇺🇸 USA", division: "Lightweight", record: { w: 24, l: 9, d: 0 }, age: 38, reach: '69"', finishRate: "71%", lastResult: "Loss", bio: "Three-time Bellator champion and serial UFC fan favourite. One of the most exciting fighters alive. Returns to action against Ruffy at Freedom 250." },
  lewis: { name: "Derrick Lewis", nationality: "🇺🇸 USA", division: "Heavyweight", record: { w: 28, l: 11, d: 0 }, age: 39, reach: '79"', finishRate: "82%", lastResult: "Win", bio: "The all-time UFC KO record holder. Fights Hokit in an explosive heavyweight matchup on the Freedom 250 undercard. One punch can end any fight." },
  ruffy: { name: "Mauricio Ruffy", nationality: "🇧🇷 Brazil", division: "Lightweight", record: { w: 10, l: 1, d: 0 }, age: 25, reach: '72"', finishRate: "90%", lastResult: "KO", bio: "Rising Brazilian lightweight sensation with a near-perfect finish rate. Faces Michael Chandler in a must-watch lightweight clash at Freedom 250." },
};

export const RECENT_FIGHTS = [
  { winner: "Topuria", loser: "Oliveira", method: "KO", methodType: "finish", round: "R2", time: "3:17", fighterId: "topuria", event: "UFC 313 — Mar 2026", title: true },
  { winner: "Pereira", loser: "Hill", method: "KO", methodType: "finish", round: "R1", time: "1:55", fighterId: "pereira", event: "UFC 313 — Mar 2026", title: true },
  { winner: "Gaethje", loser: "Hooker", method: "TKO", methodType: "finish", round: "R3", time: "4:02", fighterId: "gaethje", event: "UFC Fight Night — Feb 2026", title: false },
  { winner: "Gane", loser: "Aspinall", method: "KO", methodType: "finish", round: "R4", time: "2:31", fighterId: "gane", event: "UFC 321 — Jan 2026", title: true },
  { winner: "O'Malley", loser: "Dvalishvili", method: "Dec", methodType: "decision", round: "R5", time: "5:00", fighterId: "omalley", event: "UFC 327 — Apr 2026", title: false },
  { winner: "Lewis", loser: "Spivak", method: "KO", methodType: "finish", round: "R1", time: "0:48", fighterId: "lewis", event: "UFC Fight Night — Apr 2026", title: false },
  { winner: "Ruffy", loser: "Fiziev", method: "KO", methodType: "finish", round: "R2", time: "1:12", fighterId: "ruffy", event: "UFC 327 — Apr 2026", title: false },
  { winner: "Chandler", loser: "Poirier", method: "TKO", methodType: "finish", round: "R3", time: "3:55", fighterId: "chandler", event: "UFC 319 — Dec 2025", title: false },
];

export const UPCOMING_FIGHTS = [
  { bout: "Topuria vs Gaethje", division: "Lightweight", card: "Main Event — Undisputed Title", date: "Jun 14" },
  { bout: "Pereira vs Gane", division: "Heavyweight", card: "Co-Main — Interim Title", date: "Jun 14" },
  { bout: "O'Malley vs Zahabi", division: "Bantamweight", card: "Main Card", date: "Jun 14" },
  { bout: "Lewis vs Hokit", division: "Heavyweight", card: "Main Card", date: "Jun 14" },
  { bout: "Ruffy vs Chandler", division: "Lightweight", card: "Main Card", date: "Jun 14" },
  { bout: "Nickal vs Daukaus", division: "Middleweight", card: "Main Card", date: "Jun 14" },
  { bout: "Lopes vs Garcia", division: "Featherweight", card: "Main Card", date: "Jun 14" },
];

// Full 20-driver F1 grid
export const F1_DRIVERS = [
  { pos: 1,  id: "antonelli",  name: "Kimi Antonelli",    team: "Mercedes",     nationality: "🇮🇹 Italy",       age: 19, pts: 72,  wins: 2, podiums: 2, color: "#00D2BE", bio: "The youngest-ever F1 championship leader at 19 years, 6 months. Won in Australia and Japan in his debut season. Described by Russell as frighteningly fast in every session." },
  { pos: 2,  id: "russell",    name: "George Russell",     team: "Mercedes",     nationality: "🇬🇧 UK",          age: 28, pts: 63,  wins: 0, podiums: 3, color: "#00D2BE", bio: "Led the championship after the first two races before Antonelli displaced him in Japan. Three podiums from three starts — consistent and fast but still searching for his first 2026 win." },
  { pos: 3,  id: "piastri",    name: "Oscar Piastri",      team: "McLaren",      nationality: "🇦🇺 Australia",   age: 24, pts: 52,  wins: 1, podiums: 2, color: "#FF8700", bio: "Missed the first two races of 2026 due to injury, then returned with P2 in Japan on his very first start. McLaren are trailing Mercedes but showing strong underlying pace." },
  { pos: 4,  id: "leclerc",    name: "Charles Leclerc",    team: "Ferrari",      nationality: "🇲🇨 Monaco",      age: 28, pts: 45,  wins: 0, podiums: 2, color: "#DC0000", bio: "Two podiums from three races but no wins yet for Ferrari's lead driver. Shows strong qualifying pace but Mercedes has the edge in race trim." },
  { pos: 5,  id: "hamilton",   name: "Lewis Hamilton",     team: "Ferrari",      nationality: "🇬🇧 UK",          age: 41, pts: 40,  wins: 0, podiums: 1, color: "#DC0000", bio: "The 7-time world champion in his second season with Ferrari after 12 years at Mercedes. Still adapting to the SF-26. His arrival at Ferrari is the biggest story of the grid." },
  { pos: 6,  id: "norris",     name: "Lando Norris",       team: "McLaren",      nationality: "🇬🇧 UK",          age: 25, pts: 22,  wins: 0, podiums: 0, color: "#FF8700", bio: "Reigning 2025 world champion defending his title. Difficult start to the season with only 22 points from 3 rounds. McLaren are chasing car upgrades to claw back the deficit." },
  { pos: 7,  id: "gasly",      name: "Pierre Gasly",       team: "Alpine",       nationality: "🇫🇷 France",      age: 30, pts: 18,  wins: 0, podiums: 0, color: "#0093CC", bio: "Best of the rest behind the top three constructors. Strong P7 in Japan was a positive sign for Alpine's 2026 package." },
  { pos: 8,  id: "verstappen", name: "Max Verstappen",     team: "Red Bull",     nationality: "🇳🇱 Netherlands", age: 28, pts: 14,  wins: 0, podiums: 0, color: "#1E41FF", bio: "4-time world champion enduring Red Bull's worst start in years — only 14 points after 3 races. The 2026 regulation changes have erased their advantage." },
  { pos: 9,  id: "colapinto",  name: "Franco Colapinto",   team: "Alpine",       nationality: "🇦🇷 Argentina",   age: 21, pts: 12,  wins: 0, podiums: 0, color: "#0093CC", bio: "Argentine talent who impressed at Williams in 2025. Joined Alpine for 2026 and is showing strong pace in his second season. Great future ahead." },
  { pos: 10, id: "alonso",     name: "Fernando Alonso",    team: "Aston Martin", nationality: "🇪🇸 Spain",       age: 44, pts: 10,  wins: 0, podiums: 0, color: "#006F62", bio: "Two-time world champion still racing at 44. Consistent points scorer for Aston Martin. One of the greatest F1 drivers of all time." },
  { pos: 11, id: "stroll",     name: "Lance Stroll",       team: "Aston Martin", nationality: "🇨🇦 Canada",      age: 26, pts: 8,   wins: 0, podiums: 0, color: "#006F62", bio: "Aston Martin number two driver. Son of team owner Lawrence Stroll. Scoring consistent points in the midfield battle." },
  { pos: 12, id: "sainz",      name: "Carlos Sainz",       team: "Williams",     nationality: "🇪🇸 Spain",       age: 30, pts: 7,   wins: 0, podiums: 0, color: "#005AFF", bio: "Joined Williams for 2026 after leaving Ferrari. Son of WRC legend Carlos Sainz Sr. Bringing experience and speed to a rebuilding team." },
  { pos: 13, id: "albon",      name: "Alexander Albon",    team: "Williams",     nationality: "🇹🇭 Thailand",    age: 28, pts: 6,   wins: 0, podiums: 0, color: "#005AFF", bio: "Williams team leader and fan favourite. Thai-British driver who rebuilt his career at Williams after being dropped by Red Bull." },
  { pos: 14, id: "hulkenberg", name: "Nico Hülkenberg",    team: "Audi",         nationality: "🇩🇪 Germany",     age: 38, pts: 5,   wins: 0, podiums: 0, color: "#bb0f28", bio: "Veteran of over 200 F1 starts leading Audi's new factory team. Finally has factory backing in the twilight of his career." },
  { pos: 15, id: "bortoleto",  name: "Gabriel Bortoleto",  team: "Audi",         nationality: "🇧🇷 Brazil",      age: 20, pts: 4,   wins: 0, podiums: 0, color: "#bb0f28", bio: "2024 F2 champion and highly rated young Brazilian talent. Partnered with Hülkenberg at Audi's new works team in his rookie F1 season." },
  { pos: 16, id: "ocon",       name: "Esteban Ocon",       team: "Haas",         nationality: "🇫🇷 France",      age: 28, pts: 3,   wins: 0, podiums: 0, color: "#E8002D", bio: "Former Alpine driver now at Haas. French talent with a race win to his name. Looking to rebuild his career with an improving team." },
  { pos: 17, id: "bearman",    name: "Oliver Bearman",     team: "Haas",         nationality: "🇬🇧 UK",          age: 19, pts: 2,   wins: 0, podiums: 0, color: "#E8002D", bio: "Highly-rated British youngster in his first full F1 season. Impressed on his debut at Ferrari in 2024. Suffered a scary crash in Japan but escaped unharmed." },
  { pos: 18, id: "hadjar",     name: "Isack Hadjar",       team: "Red Bull",     nationality: "🇫🇷 France",      age: 20, pts: 2,   wins: 0, podiums: 0, color: "#1E41FF", bio: "French-Algerian talent promoted from the Red Bull junior programme. Partnered with Verstappen at a difficult time for the team." },
  { pos: 19, id: "doohan",     name: "Jack Doohan",        team: "Alpine",       nationality: "🇦🇺 Australia",   age: 21, pts: 1,   wins: 0, podiums: 0, color: "#0093CC", bio: "Son of MotoGP legend Mick Doohan. Australian talent making his F1 debut with Alpine in 2026. Part of the Alpine driver academy." },
  { pos: 20, id: "lawson",     name: "Liam Lawson",        team: "RB",           nationality: "🇳🇿 New Zealand", age: 22, pts: 0,   wins: 0, podiums: 0, color: "#6692FF", bio: "New Zealand talent who had an impressive cameo at Red Bull in 2023 and 2024. Now in a full season with sister team RB, looking to impress." },
];

export const F1_CONSTRUCTORS = [
  { pos: 1, name: "Mercedes",     pts: 135, color: "#00D2BE" },
  { pos: 2, name: "Ferrari",      pts: 90,  color: "#DC0000" },
  { pos: 3, name: "McLaren",      pts: 56,  color: "#FF8700" },
  { pos: 4, name: "Alpine",       pts: 36,  color: "#0093CC" },
  { pos: 5, name: "Red Bull",     pts: 16,  color: "#1E41FF" },
  { pos: 6, name: "Aston Martin", pts: 12,  color: "#006F62" },
  { pos: 7, name: "Williams",     pts: 10,  color: "#005AFF" },
  { pos: 8, name: "Audi",         pts: 9,   color: "#bb0f28" },
  { pos: 9, name: "Haas",         pts: 5,   color: "#E8002D" },
  { pos: 10, name: "RB",          pts: 0,   color: "#6692FF" },
];

export const UPCOMING_RACES = [
  { round: 5,  name: "Miami Grand Prix",    circuit: "Miami International Autodrome",    date: "May 4, 2026",  target: "2026-05-04T19:00:00Z" },
  { round: 6,  name: "Monaco Grand Prix",   circuit: "Circuit de Monaco",               date: "May 24, 2026", target: "2026-05-24T13:00:00Z" },
  { round: 7,  name: "Spanish Grand Prix",  circuit: "Circuit de Barcelona-Catalunya",   date: "Jun 1, 2026",  target: "2026-06-01T13:00:00Z" },
  { round: 8,  name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve",        date: "Jun 15, 2026", target: "2026-06-15T18:00:00Z" },
];