import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const readAbsolute = (path) => readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const plugin = json('plugin.json');
assert(
  plugin.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  'portable plugin schema',
);
assert(plugin.name === 'domain-agent-kit', 'portable plugin name');

const mcp = json('mcp.json');
assert(
  mcp.$schema === 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  'portable MCP schema',
);
const server = mcp.mcpServers?.['domain-mcp'];
assert(server?.type === 'stdio', 'domain-mcp must be a stdio server');
const portableRoot = '${' + 'PLUGIN_ROOT}/scripts/launch-domain-mcp.sh';
assert(server.args?.includes(portableRoot), 'portable launcher path');
assert(server.env?.DOMAIN_MCP_VERSION === '3.0.0', 'portable MCP version is exact');

const skill = read('skills/domain-management/SKILL.md');
assert(/^name: domain-management$/m.test(skill), 'canonical skill name');
for (const linked of [
  'workflows/research.md',
  'workflows/audit.md',
  'workflows/dns.md',
  'workflows/renewals.md',
  'workflows/setup.md',
  'workflows/status.md',
  'references/dns.md',
  'references/troubleshooting.md',
  'references/safety.md',
]) {
  assert(skill.includes(`](${linked})`), `SKILL.md must link ${linked}`);
  read(`skills/domain-management/${linked}`);
}

const setupWorkflow = read('skills/domain-management/workflows/setup.md');
for (const obligation of [
  'My Info → Security → API Settings',
  'Hermes:',
  'Claude Code:',
  'Other Agent Plugins v1 hosts:',
  'production or sandbox',
  'read-only account information',
  'ready`, `blocked`, or `approval_required',
]) {
  assert(setupWorkflow.includes(obligation), `setup workflow preserves: ${obligation}`);
}
const statusWorkflow = read('skills/domain-management/workflows/status.md');
for (const obligation of [
  'Node and `npx`',
  'credential-variable presence',
  'server help',
  'read-only account information',
  'ready, warning, or blocked',
]) {
  assert(statusWorkflow.includes(obligation), `status workflow preserves: ${obligation}`);
}

for (const forbidden of [
  'agents',
  'commands',
  'skills/dns-best-practices',
  'scripts/session-preflight.sh',
]) {
  assert(!existsSync(join(root, forbidden)), `${forbidden} must be removed after absorption`);
}

const portableSkillFiles = execFileSync('find', ['skills/domain-management', '-type', 'f'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n');
for (const path of portableSkillFiles) {
  const body = read(path);
  for (const token of [
    'CLAUDE_PLUGIN_ROOT',
    'AskUserQuestion',
    'mcp__domain-mcp__',
    'ReadMcpResourceTool',
  ]) {
    assert(!body.includes(token), `${path} contains host coupling: ${token}`);
  }
}

const claudeManifest = json('.claude-plugin/plugin.json');
assert(claudeManifest.name === plugin.name, 'Claude adapter name must match portable manifest');
assert(
  claudeManifest.version === plugin.version,
  'Claude adapter version must match portable manifest',
);

const claudeMcp = json('.mcp.json');
const claudeRoot = '${' + 'CLAUDE_PLUGIN_ROOT}/scripts/launch-domain-mcp.sh';
assert(
  claudeMcp.mcpServers?.['domain-mcp']?.args?.includes(claudeRoot),
  'Claude MCP adapter must route to the shared launcher',
);
assert(
  claudeMcp.mcpServers['domain-mcp'].env.DOMAIN_MCP_VERSION === '3.0.0',
  'Claude version matches portable MCP',
);

const hooks = json('hooks/hooks.json');
assert(
  Object.keys(hooks.hooks).join(',') === 'PreToolUse',
  'only the useful destructive-action hook remains',
);
assert(
  hooks.hooks.PreToolUse[0].matcher === 'mcp__domain-mcp__.*',
  'hook inspects every domain-mcp call',
);
assert(
  (statSync(join(root, 'scripts/confirm-destructive.sh')).mode & 0o111) !== 0,
  'destructive hook executable',
);
assert(
  (statSync(join(root, 'scripts/launch-domain-mcp.sh')).mode & 0o111) !== 0,
  'launcher executable',
);
execFileSync('bash', ['-n', 'scripts/confirm-destructive.sh'], { cwd: root });
execFileSync('bash', ['-n', 'scripts/launch-domain-mcp.sh'], { cwd: root });

const approvalPolicy = json('hooks/approval-policy.json');
const schemaFiles = execFileSync(
  'find',
  ['../domain-mcp/src/schemas', '-maxdepth', '1', '-name', '*.ts'],
  {
    cwd: root,
    encoding: 'utf8',
  },
)
  .trim()
  .split('\n')
  .filter((path) => !path.endsWith('/common.ts') && !path.endsWith('/index.ts'));
const registeredActions = new Map();
for (const path of schemaFiles) {
  const body = readAbsolute(path);
  const toolName = body.match(/name:\s*'([^']+)'/)?.[1];
  if (!toolName) continue;
  const normalized = `mcp__domain-mcp__${toolName.replaceAll('.', '_')}`;
  registeredActions.set(
    normalized,
    [...body.matchAll(/^ {4}([a-zA-Z0-9_]+): \{/gm)].map((match) => match[1]),
  );
}
assert(
  JSON.stringify([...Object.keys(approvalPolicy)].sort()) ===
    JSON.stringify([...registeredActions.keys()].sort()),
  'approval policy covers every composite Domain MCP tool',
);
for (const [tool, actions] of registeredActions) {
  assert(
    JSON.stringify([...approvalPolicy[tool].all].sort()) === JSON.stringify([...actions].sort()),
    `${tool} approval policy must cover every registered action`,
  );
  for (const operation of approvalPolicy[tool].mutating) {
    assert(actions.includes(operation), `${tool}:${operation} must exist in the MCP registry`);
  }
}

const hookCall = (tool_name, operation, extra = {}) =>
  spawnSync('bash', ['scripts/confirm-destructive.sh'], {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify({ tool_name, tool_input: { operation, ...extra } }),
  });

const safe = hookCall('mcp__domain-mcp__domains_manage', 'list');
assert(safe.status === 0 && safe.stdout === '', 'safe operations pass without prompting');

for (const [tool, policy] of Object.entries(approvalPolicy)) {
  for (const operation of policy.mutating) {
    const result = hookCall(tool, operation, { domain: 'example.com' });
    assert(result.status === 0, `${tool}:${operation} hook exits successfully`);
    const decision = JSON.parse(result.stdout);
    assert(
      decision.hookSpecificOutput?.permissionDecision === 'ask',
      `${tool}:${operation} asks for approval`,
    );
  }
}

const unknownOperation = hookCall('mcp__domain-mcp__domains_manage', 'future_paid_action');
assert(
  JSON.parse(unknownOperation.stdout).hookSpecificOutput.permissionDecision === 'ask',
  'unknown Domain MCP operations fail closed',
);
const unknownTool = hookCall('mcp__domain-mcp__future_manage', 'write');
assert(
  JSON.parse(unknownTool.stdout).hookSpecificOutput.permissionDecision === 'ask',
  'unknown Domain MCP tools fail closed',
);

const malformed = spawnSync('bash', ['scripts/confirm-destructive.sh'], {
  cwd: root,
  encoding: 'utf8',
  input: '{',
});
assert(
  JSON.parse(malformed.stdout).hookSpecificOutput.permissionDecision === 'ask',
  'parse failure asks for approval',
);

console.log('domain-agent-kit structure and safety checks passed');
