// ─── Chat load test ──────────────────────────────────────────────────────
//
// Simulates N concurrent "users" hitting the chat feature the same way
// ChatBox.jsx does: each one signs in, opens a presence channel, opens a
// postgres_changes realtime subscription on `messages`, and sends a few
// messages. Reports connection/message success rates and latency.
//
// Every test user is created via the Supabase Admin API (service_role key)
// with an email like loadtest+run<ID>-<N>@example.test, and every message
// this script sends is prefixed with a run tag, so cleanup can find and
// remove everything this run created without touching real data.
//
// Usage:
//   node --env-file=.env.local scripts/load-test-chat.mjs
//   node --env-file=.env.local scripts/load-test-chat.mjs --users=50
//   node --env-file=.env.local scripts/load-test-chat.mjs --cleanup=<runId>
//   node --env-file=.env.local scripts/load-test-chat.mjs --cleanup-all
//
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// VITE_SUPABASE_ANON_KEY to already be in .env.local (they already are,
// since hero.js / the app itself depend on them).

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Node's built-in global WebSocket doesn't fully match what
// @supabase/realtime-js's Phoenix socket code expects — this is what
// caused the earlier "connToClose.close is not a function" crash, and is
// also why every presence/chat channel subscription was silently timing
// out (0% success at every scale, even 10 users) rather than actually
// connecting. Forcing the well-tested `ws` package as the WebSocket
// implementation fixes both.
globalThis.WebSocket = WebSocket;

// @supabase/realtime-js's socket teardown (removeAllChannels /
// client.realtime.disconnect) has a rough edge under Node's native
// WebSocket implementation — it can throw an uncaught exception outside
// any promise chain during cleanup. That's a library-internal issue, not
// a sign anything is actually wrong, so we don't want one flaky teardown
// to kill a 200-user run and lose all the stats gathered so far.
process.on("uncaughtException", (err) => {
  console.error(`\n[non-fatal, ignored] ${err.message}`);
});

// ─── Config ─────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const NUM_USERS          = Number(args.users) || 200;
const MESSAGES_PER_USER  = Number(args.messages) || 2;
const SIGNUP_BATCH_SIZE  = 10;   // parallel admin.createUser calls per batch
const SIGNUP_BATCH_DELAY = 300;  // ms between batches, to be nice to the admin API
const CONNECT_STAGGER_MS = 100;  // ms between each simulated client connecting
const MESSAGE_INTERVAL_MS = 800; // ms between a user's messages
const TEST_TIMEOUT_MS    = 90_000; // hard stop if something hangs

const RUN_ID  = `run${Date.now().toString(36)}`;
const TAG     = `[LOADTEST-${RUN_ID}]`;
const PASSWORD = "LoadTest_" + Math.random().toString(36).slice(2) + "!1Aa";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY       = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in env.");
  console.error("Run with: node --env-file=.env.local scripts/load-test-chat.mjs");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Cleanup mode ───────────────────────────────────────────────────────

async function cleanupRun(runId) {
  const tag = `[LOADTEST-${runId}]`;
  console.log(`Cleaning up ${runId}...`);

  const { error: msgErr, count } = await admin
    .from("messages")
    .delete({ count: "exact" })
    .like("content", `${tag}%`);
  if (msgErr) console.error("  Message cleanup error:", msgErr.message);
  else console.log(`  Deleted ${count ?? "?"} tagged messages`);

  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("  Failed to list users for cleanup:", listErr.message);
    return;
  }
  const toDelete = userList.users.filter((u) => u.email?.startsWith(`loadtest+${runId}-`));

  if (toDelete.length > 0) {
    const { error: profileErr, count: profileCount } = await admin
      .from("profiles")
      .delete({ count: "exact" })
      .in("id", toDelete.map((u) => u.id));
    if (profileErr) console.error("  Profile cleanup error:", profileErr.message);
    else console.log(`  Deleted ${profileCount ?? "?"} test profiles`);
  }

  console.log(`  Deleting ${toDelete.length} test users...`);
  for (const u of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`    Failed to delete ${u.email}:`, error.message);
  }
  console.log("Cleanup done.");
}

async function cleanupAll() {
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    return;
  }
  const runIds = new Set(
    userList.users
      .map((u) => u.email?.match(/^loadtest\+(run[a-z0-9]+)-/)?.[1])
      .filter(Boolean)
  );
  console.log(`Found ${runIds.size} previous load-test run(s) to clean up.`);
  for (const id of runIds) await cleanupRun(id);
}

if (args.cleanup) {
  await cleanupRun(String(args.cleanup));
  process.exit(0);
}
if (args["cleanup-all"]) {
  await cleanupAll();
  process.exit(0);
}

// ─── Setup: create test users ──────────────────────────────────────────

async function createTestUsers(n) {
  const users = [];
  for (let batchStart = 0; batchStart < n; batchStart += SIGNUP_BATCH_SIZE) {
    const batch = Array.from(
      { length: Math.min(SIGNUP_BATCH_SIZE, n - batchStart) },
      (_, i) => batchStart + i
    );
    const results = await Promise.allSettled(
      batch.map((i) => {
        const email = `loadtest+${RUN_ID}-${i}@example.test`;
        const username = `loadtest-${RUN_ID}-${i}`;
        return admin.auth.admin
          .createUser({ email, password: PASSWORD, email_confirm: true })
          .then(async (res) => {
            if (res.error) throw res.error;
            const userId = res.data.user.id;
            // messages.user_id has a foreign key to profiles, not directly
            // to auth.users — mirror what signUpWithEmail does in
            // AuthContext.jsx so these test users can actually post.
            const { error: profileErr } = await admin.from("profiles").upsert({
              id: userId,
              username,
              email,
              avatar_url: null,
              created_at: new Date().toISOString(),
            });
            if (profileErr) throw profileErr;
            return { id: userId, email, username };
          });
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") users.push(r.value);
      else console.error("  Signup failed:", r.reason?.message || r.reason);
    }
    process.stdout.write(`\r  Created ${users.length}/${n} test users...`);
    await sleep(SIGNUP_BATCH_DELAY);
  }
  console.log("");
  return users;
}

// ─── Simulated client ───────────────────────────────────────────────────

async function runVirtualUser(testUser, index, stats) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const signInStart = Date.now();
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: testUser.email,
    password: PASSWORD,
  });
  if (signInErr) {
    stats.signInFailures++;
    return;
  }
  stats.signInLatencies.push(Date.now() - signInStart);

  // Presence channel — mirrors ChatBox.jsx's "online-users" channel
  await new Promise((resolve) => {
    const presence = client.channel("online-users", {
      config: { presence: { key: testUser.id } },
    });
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      ok ? stats.presenceConnected++ : stats.presenceFailed++;
      resolve();
    };
    presence.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presence.track({ user_id: testUser.id, username: testUser.username || `loadtest-${index}` });
        finish(true);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        finish(false);
      }
    });
    setTimeout(() => finish(false), 10_000);
  });

  // Chat realtime subscription — mirrors ChatBox.jsx's "global-chat" channel
  const chatChannel = client.channel("global-chat").on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages" },
    () => { stats.realtimeEventsReceived++; }
  );
  await new Promise((resolve) => {
    let settled = false;
    chatChannel.subscribe((status) => {
      if (settled) return;
      if (status === "SUBSCRIBED") {
        settled = true;
        stats.chatChannelConnected++;
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        settled = true;
        stats.chatChannelFailed++;
        resolve();
      }
    });
    setTimeout(() => { if (!settled) { settled = true; stats.chatChannelFailed++; resolve(); } }, 10_000);
  });

  // Send messages
  for (let m = 0; m < MESSAGES_PER_USER; m++) {
    const sendStart = Date.now();
    const { error } = await client
      .from("messages")
      .insert({ user_id: testUser.id, content: `${TAG} test message ${m} from user ${index}` });
    if (error) {
      stats.messageFailures++;
      if (stats.messageFailures <= 3) {
        console.error(`\n  [message insert failed] code=${error.code} message=${error.message}`);
      }
    } else {
      stats.messageSuccesses++;
      stats.messageLatencies.push(Date.now() - sendStart);
    }
    await sleep(MESSAGE_INTERVAL_MS);
  }

  // Deliberately not calling client.removeAllChannels() here — its
  // teardown path is what crashes under Node's native WebSocket (see the
  // uncaughtException handler above for why). We don't need a graceful
  // disconnect for a short-lived load-test client; the process exit at
  // the end of main() tears down every socket anyway.
}

function summarize(label, arr) {
  if (arr.length === 0) return `${label}: no data`;
  const sorted = [...arr].sort((a, b) => a - b);
  const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return `${label}: avg ${avg}ms, p95 ${p95}ms, max ${sorted[sorted.length - 1]}ms (n=${arr.length})`;
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Load test ${RUN_ID}: ${NUM_USERS} users, ${MESSAGES_PER_USER} messages each`);
  console.log(`Tag: ${TAG}\n`);

  console.log("Creating test users via Admin API...");
  const users = await createTestUsers(NUM_USERS);
  console.log(`Created ${users.length}/${NUM_USERS} test users.\n`);

  if (users.length === 0) {
    console.error("No test users created — aborting.");
    process.exit(1);
  }

  const stats = {
    signInFailures: 0,
    signInLatencies: [],
    presenceConnected: 0,
    presenceFailed: 0,
    chatChannelConnected: 0,
    chatChannelFailed: 0,
    realtimeEventsReceived: 0,
    messageSuccesses: 0,
    messageFailures: 0,
    messageLatencies: [],
  };

  console.log("Connecting virtual users (staggered)...");
  const runPromises = users.map((u, i) =>
    sleep(i * CONNECT_STAGGER_MS).then(() => runVirtualUser(u, i, stats))
  );

  const timeout = sleep(TEST_TIMEOUT_MS).then(() => {
    console.log("\n[!] Hit overall timeout — some clients may still be connecting/sending.");
  });

  await Promise.race([Promise.allSettled(runPromises), timeout]);

  console.log("\n─── Results ───────────────────────────────────────────");
  console.log(`Sign-ins:          ${users.length - stats.signInFailures}/${users.length} succeeded`);
  console.log(`Presence channel:  ${stats.presenceConnected} connected, ${stats.presenceFailed} failed`);
  console.log(`Chat channel:      ${stats.chatChannelConnected} connected, ${stats.chatChannelFailed} failed`);
  console.log(`Messages sent:     ${stats.messageSuccesses} succeeded, ${stats.messageFailures} failed`);
  console.log(`Realtime events:   ${stats.realtimeEventsReceived} received across all clients`);
  console.log(summarize("Sign-in latency", stats.signInLatencies));
  console.log(summarize("Message send latency", stats.messageLatencies));
  console.log("───────────────────────────────────────────────────────\n");

  console.log(`To clean up test data from this run:`);
  console.log(`  node --env-file=.env.local scripts/load-test-chat.mjs --cleanup=${RUN_ID}\n`);

  process.exit(0);
}

main();
