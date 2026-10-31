// Rugby union tables. The snapshot lives in snapshots/rugby.json, regenerated
// from Wikipedia by `npm run update:snapshots` (no working live rugby API on
// the free plan). Season labels come from the snapshot so nothing here goes
// stale when a new season starts.
import snapshot from "./snapshots/rugby.json";

export const RUGBY_UPDATED = snapshot.updated;
export const RUGBY_SOURCE = snapshot.source;
export const SIX_NATIONS = snapshot.sixNations.table;
export const URC_STANDINGS = snapshot.urc.table;
export const PREMIERSHIP_STANDINGS = snapshot.premiership.table;
export const RUGBY_SEASONS = {
  sixnations: snapshot.sixNations.season,
  urc: snapshot.urc.season,
  premiership: snapshot.premiership.season,
};
export const RECENT_RUGBY = snapshot.recent;
