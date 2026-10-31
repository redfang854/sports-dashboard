/**
 * UNIT — src/api/teamMatch.js (football-data club -> API-Football team id)
 *
 * The old lookup used football-data's exact name ("Hull City AFC") with a
 * 2024 season filter, so most clubs never matched and promoted clubs never
 * could. These cases use real API-Football search results (31 Oct 2026).
 *
 * Goes right: the senior club in the league's country with the closest name.
 * Goes wrong (asserted): youth/women/reserve sides, same-name clubs abroad,
 * a different club sharing a word ("Wolverhampton Casuals"), a cross-town
 * rival ("Manchester City" for United). A wrong photo squad is worse than
 * none, so ambiguous results must return null.
 */
import { describe, it, expect } from "vitest";
import { normalize, tokens, searchQueries, score, pickTeam, MIN_SCORE } from "../../../src/api/teamMatch.js";

const team = (id, name, country = "England") => ({ team: { id, name, country } });

describe("normalize / tokens", () => {
  it("strips accents, punctuation and club-form words", () => {
    expect(normalize("Club Atlético de Madrid")).toBe("club atletico de madrid");
    expect(tokens("Club Atlético de Madrid")).toEqual(["atletico", "madrid"]);
    expect(tokens("Brighton & Hove Albion FC")).toEqual(["brighton", "hove", "albion"]);
    expect(tokens("1. FC Union Berlin")).toEqual(["union", "berlin"]);
    expect(tokens("TSG 1899 Hoffenheim")).toEqual(["hoffenheim"]);
  });
});

describe("searchQueries", () => {
  it("tries the cleaned full name, then the short name, then the first word", () => {
    expect(searchQueries("FC Internazionale Milano", "Inter")).toEqual(["internazionale milano", "inter", "internazionale"]);
  });
  it("puts a known alias first", () => {
    expect(searchQueries("Wolverhampton Wanderers FC", "Wolverhampton")[0]).toBe("wolves");
  });
  it("drops duplicates and anything under 3 characters", () => {
    expect(searchQueries("Hull City AFC", "Hull City")).toEqual(["hull city", "hull"]);
    expect(searchQueries("AS", "")).toEqual([]);
  });
});

describe("score", () => {
  it("is 1 for the same club after cleaning", () => {
    expect(score("Hull City AFC", "Hull City")).toBe(1);
  });
  it("is strong when the candidate's words are all in our name", () => {
    expect(score("Brighton & Hove Albion FC", "Brighton")).toBeGreaterThanOrEqual(MIN_SCORE);
  });
  it("is weak when the candidate has words we don't", () => {
    expect(score("Wolverhampton", "Wolverhampton Casuals")).toBeLessThan(MIN_SCORE);
    expect(score("Manchester United FC", "Manchester City")).toBeLessThan(MIN_SCORE);
  });
});

describe("pickTeam (real search results)", () => {
  it("Hull City AFC -> Hull City (64), not the women/U21/U23/U18 sides", () => {
    const results = [team(64, "Hull City"), team(15445, "Hull City W"), team(15647, "Hull City U23"), team(20084, "Hull City U21"), team(23178, "Hull City U18")];
    expect(pickTeam(results, { fullName: "Hull City AFC", shortName: "Hull City", country: "England" })).toBe(64);
  });

  it("Inter via the short name, ignoring Inter clubs in other countries", () => {
    const results = [team(505, "Inter", "Italy"), team(9568, "Inter Miami", "USA"), team(1, "Inter Turku", "Finland")];
    expect(pickTeam(results, { fullName: "FC Internazionale Milano", shortName: "Inter", country: "Italy" })).toBe(505);
  });

  it("Wolves via alias, not Wolves Sporting / Warrington Wolves / Wolves U21 / Finnish Wolves", () => {
    const results = [team(39, "Wolves"), team(7204, "Wolves U21"), team(9007, "Wolves Sporting"), team(13495, "Wolves", "Finland"), team(20632, "Warrington Wolves")];
    expect(pickTeam(results, { fullName: "Wolverhampton Wanderers FC", shortName: "Wolverhampton", country: "England" })).toBe(39);
  });

  it("returns null rather than guessing Wolverhampton Casuals", () => {
    const results = [team(9006, "Wolverhampton Casuals"), team(9999, "Wolverhampton Sporting")];
    expect(pickTeam(results, { fullName: "Wolverhampton Wanderers FC", shortName: "Wolverhampton", country: "England" })).toBeNull();
  });

  it("does not take the cross-town rival", () => {
    expect(pickTeam([team(50, "Manchester City")], { fullName: "Manchester United FC", shortName: "Man United", country: "England" })).toBeNull();
  });

  it("matches across accents and naming styles", () => {
    expect(pickTeam([team(530, "Atletico Madrid", "Spain")], { fullName: "Club Atlético de Madrid", shortName: "Atleti", country: "Spain" })).toBe(530);
    expect(pickTeam([team(157, "Bayern München", "Germany")], { fullName: "FC Bayern München", shortName: "Bayern", country: "Germany" })).toBe(157);
    expect(pickTeam([team(85, "Paris Saint Germain", "France")], { fullName: "Paris Saint-Germain FC", shortName: "PSG", country: "France" })).toBe(85);
  });

  it("handles empty or malformed results", () => {
    expect(pickTeam([], { fullName: "X", shortName: "", country: "England" })).toBeNull();
    expect(pickTeam([{}, { team: {} }, null], { fullName: "Hull City", country: "England" })).toBeNull();
  });
});
