// ─── Ramped chat load test ────────────────────────────────────────────────
//
// Runs load-test-chat.mjs multiple times at increasing user counts, each
// as its own child process. Each stage gets a completely clean process
// (own sockets, own event loop), so results from one stage can't bleed
// into the next — no lingering connections, no accumulated state.
//
// Usage:
//   node --env-file=.env.local scripts/load-test-chat-ramp.mjs
//   node --env-file=.env.local scripts/load-test-chat-ramp.mjs --stages=10,25,50,100,200
//   node --env-file=.env.local scripts/load-test-chat-ramp.mjs --messages=1 --pause=10
//
// After it finishes, clean up every stage's test data at once with:
//   node --env-file=.env.local scripts/load-test-chat.mjs --cleanup-all

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const STAGES = (args.stages ? String(args.stages).split(",") : ["10", "25", "50", "100", "200"])
  .map(Number)
  .filter((n) => Number.isFinite(n) && n > 0);

const MESSAGES_PER_USER = args.messages || "2";
const PAUSE_BETWEEN_STAGES_S = Number(args.pause) || 15;

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHILD_SCRIPT = join(__dirname, "load-test-chat.mjs");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Pulls the run's summary lines back out of its stdout so we can show a
// combined table at the end, instead of just leaving results scattered
// across each stage's console output above.
function parseSummary(stdout) {
  const runId = stdout.match(/^Load test (\S+):/m)?.[1];
  const signIns = stdout.match(/Sign-ins:\s+(\d+)\/(\d+) succeeded/);
  const presence = stdout.match(/Presence channel:\s+(\d+) connected, (\d+) failed/);
  const chat = stdout.match(/Chat channel:\s+(\d+) connected, (\d+) failed/);
  const messages = stdout.match(/Messages sent:\s+(\d+) succeeded, (\d+) failed/);
  return {
    runId,
    signInsOk: signIns ? Number(signIns[1]) : 0,
    signInsTotal: signIns ? Number(signIns[2]) : 0,
    presenceOk: presence ? Number(presence[1]) : 0,
    chatOk: chat ? Number(chat[1]) : 0,
    messagesOk: messages ? Number(messages[1]) : 0,
    messagesFailed: messages ? Number(messages[2]) : 0,
  };
}

async function main() {
  console.log(`Ramped load test — stages: ${STAGES.join(" → ")} users`);
  console.log(`(${PAUSE_BETWEEN_STAGES_S}s pause between stages so sockets fully close first)\n`);

  const results = [];

  for (const n of STAGES) {
    console.log(`\n════════════════════════════════════════════════════`);
    console.log(`  STAGE: ${n} users`);
    console.log(`════════════════════════════════════════════════════`);

    const proc = spawnSync(
      process.execPath,
      ["--env-file=.env.local", CHILD_SCRIPT, `--users=${n}`, `--messages=${MESSAGES_PER_USER}`],
      { encoding: "utf-8", stdio: ["inherit", "pipe", "inherit"] }
    );

    process.stdout.write(proc.stdout); // still show full output live-ish
    const summary = parseSummary(proc.stdout);
    results.push({ stageSize: n, ...summary });

    if (summary.runId) {
      console.log(`\nCleaning up stage ${n} (${summary.runId}) before continuing...`);
      spawnSync(
        process.execPath,
        ["--env-file=.env.local", CHILD_SCRIPT, `--cleanup=${summary.runId}`],
        { encoding: "utf-8", stdio: "inherit" }
      );
    }

    const isLastStage = n === STAGES[STAGES.length - 1];
    if (!isLastStage) {
      console.log(`\nPausing ${PAUSE_BETWEEN_STAGES_S}s before next stage...`);
      await sleep(PAUSE_BETWEEN_STAGES_S * 1000);
    }
  }

  console.log(`\n\n═══════════════════════ RAMP SUMMARY ═══════════════════════`);
  console.log(
    "Users".padEnd(8) +
    "Sign-in".padEnd(12) +
    "Presence".padEnd(12) +
    "Chat".padEnd(10) +
    "Msgs OK".padEnd(10) +
    "Msgs Fail"
  );
  for (const r of results) {
    console.log(
      String(r.stageSize).padEnd(8) +
      `${r.signInsOk}/${r.signInsTotal}`.padEnd(12) +
      `${r.presenceOk}/${r.stageSize}`.padEnd(12) +
      `${r.chatOk}/${r.stageSize}`.padEnd(10) +
      String(r.messagesOk).padEnd(10) +
      String(r.messagesFailed)
    );
  }
  console.log(`══════════════════════════════════════════════════════════════`);

  const firstBadStage = results.find(
    (r) => r.signInsOk < r.stageSize || r.presenceOk < r.stageSize || r.chatOk < r.stageSize
  );
  if (firstBadStage) {
    console.log(`\nFirst stage with any failures: ${firstBadStage.stageSize} users.`);
    console.log(`The stage before that is roughly where things were still fully healthy.`);
  } else {
    console.log(`\nAll stages fully succeeded — try a higher --stages list to keep pushing.`);
  }

  console.log(`\nRun IDs this session: ${results.map((r) => r.runId).filter(Boolean).join(", ")}`);
  console.log(`Clean up everything from this session with:`);
  console.log(`  node --env-file=.env.local scripts/load-test-chat.mjs --cleanup-all\n`);
}

main();
