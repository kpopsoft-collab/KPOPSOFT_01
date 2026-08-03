#!/usr/bin/env node
/**
 * DDL 실행 차단 (PreToolUse 훅).
 *
 * 이 프로젝트는 로컬과 운영이 **같은 Supabase 프로젝트를 공유**한다
 * (scripts/*.cjs 머리말). 에이전트가 DDL을 돌리면 그 순간 운영 스키마가 바뀐다.
 * 그래서 스키마 변경은 무조건 사용자가 직접 적용한다.
 *
 * 에이전트가 할 수 있는 것은 마이그레이션 SQL **파일을 만드는 것**까지다.
 * 적용은 사용자에게 요청한다.
 *
 * jq가 아니라 node로 쓴 이유: 이 환경에 jq가 없다. jq로 짰더니 훅이 매번
 * "command not found"로 죽으면서 **전부 통과**시켰다(fail-open). 훅이 조용히
 * 안 도는 것이 훅이 없는 것보다 나쁘다.
 *
 * stdin 으로 훅 입력 JSON을 받고, 차단할 때만 deny JSON을 stdout 으로 낸다.
 * 아무것도 안 내면 통과.
 */

const REASON =
  "이 프로젝트는 DDL을 에이전트가 실행하지 않는다. 로컬과 운영이 같은 " +
  "Supabase 프로젝트를 공유하므로 스키마 변경은 곧 운영 반영이다. " +
  "마이그레이션 SQL '파일'까지만 만들고, 적용은 사용자에게 요청할 것. " +
  "(.claude/hooks/block-ddl.mjs)";

/** 스키마를 건드리는 SQL. execute_sql은 조회 전용으로만 쓴다. */
const SQL_DDL =
  /(^|[^\w])(create|alter|drop|truncate)\s+(or\s+replace\s+)?(table|type|domain|policy|trigger|index|schema|function|view|extension|materialized|publication|sequence|role)\b/i;

/**
 * 셸에서 마이그레이션을 밀어넣는 경로. 여기서는 일부러 좁게 잡는다 —
 * 커밋 메시지에 "create table"이 들어갔다고 막으면 도구를 못 쓴다.
 */
const SHELL_DDL =
  /supabase\s+(db\s+push|db\s+reset|migration\s+up)|psql[^|;]*?(create|alter|drop|truncate)\s+(table|type|domain|policy|trigger|index|schema)\b/i;

function read() {
  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => resolve(buf));
  });
}

const raw = await read();

let payload = "";
let pattern = null;
try {
  const input = JSON.parse(raw || "{}");
  const tool = input.tool_name ?? "";
  const ti = input.tool_input ?? {};

  if (tool === "mcp__supabase__execute_sql") {
    payload = String(ti.query ?? "");
    pattern = SQL_DDL;
  } else if (tool === "Bash" || tool === "PowerShell") {
    payload = String(ti.command ?? "");
    pattern = SHELL_DDL;
  }
} catch {
  // 입력을 못 읽으면 판단하지 않는다. 훅이 정상 도구 사용을 막으면 안 된다.
  process.exit(0);
}

if (pattern && pattern.test(payload)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: REASON,
      },
    }),
  );
}

process.exit(0);
