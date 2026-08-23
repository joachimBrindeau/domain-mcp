import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY_ROOT = resolve(PACKAGE_ROOT, '..', '..');
const SITE_URL = 'https://joachimbrindeau.github.io/domain-mcp';

function yamlString(value) {
  return JSON.stringify(value.replace(/\s+/g, ' ').trim());
}

function schemaType(schema = {}) {
  if (typeof schema.type === 'string') return schema.type;
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  if (Array.isArray(schema.enum)) return schema.enum.map(String).join(' | ');
  if (schema.anyOf || schema.oneOf) return 'multiple';
  return 'any';
}

function jsonBlock(value) {
  return `\n\n\`\`\`json\n${JSON.stringify(value ?? {}, null, 2)}\n\`\`\`\n`;
}

export function toolSlug(name) {
  return name.split('.').map(encodeURIComponent).join('/');
}

export function renderToolPage(tool) {
  const description = tool.description?.trim() || `Reference for the ${tool.name} MCP tool.`;
  const properties = tool.inputSchema?.properties ?? {};
  const required = new Set(tool.inputSchema?.required ?? []);
  const rows = Object.entries(properties).map(([name, schema]) => {
    const parameterDescription = schema.description?.replace(/\s+/g, ' ').trim() || '—';
    return `| \`${name}\` | ${schemaType(schema)} | ${required.has(name) ? 'Yes' : 'No'} | ${parameterDescription.replaceAll('|', '\\|')} |`;
  });
  const annotations = tool.annotations ?? {};

  return `---
title: ${yamlString(`${tool.name} MCP Tool`)}
description: ${yamlString(description)}
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - ${tool.name}
slug: /tools/${toolSlug(tool.name)}
---

# \`${tool.name}\`

${description}

## Safety and behavior

| Property | Value |
| --- | --- |
| Read-only | ${annotations.readOnlyHint === true ? 'Yes' : 'No'} |
| Destructive | ${annotations.destructiveHint === true ? 'Yes' : 'No'} |
| Idempotent | ${annotations.idempotentHint === true ? 'Yes' : 'No'} |
| Uses external systems | ${annotations.openWorldHint === true ? 'Yes' : 'No'} |

## Parameters

${rows.length > 0 ? `| Name | Type | Required | Description |\n| --- | --- | --- | --- |\n${rows.join('\n')}` : 'This tool has no parameters.'}

## Input schema
${jsonBlock(tool.inputSchema)}
## Output schema
${jsonBlock(tool.outputSchema)}
`;
}

function primitiveSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function renderResourcePage(resource) {
  const description =
    resource.description?.trim() || `Reference for the ${resource.name} resource.`;
  return `---
title: ${yamlString(`${resource.name} MCP Resource`)}
description: ${yamlString(description)}
slug: /resources/${primitiveSlug(resource.name)}
---

# ${resource.name}

${description}

- **URI:** \`${resource.uri}\`
- **Media type:** \`${resource.mimeType ?? 'not specified'}\`
`;
}

function renderPromptPage(prompt) {
  const description = prompt.description?.trim() || `Reference for the ${prompt.name} prompt.`;
  const argumentsList = prompt.arguments ?? [];
  return `---
title: ${yamlString(`${prompt.name} MCP Prompt`)}
description: ${yamlString(description)}
slug: /prompts/${primitiveSlug(prompt.name)}
---

# \`${prompt.name}\`

${description}

## Arguments

${argumentsList.length > 0 ? argumentsList.map((argument) => `- \`${argument.name}\`${argument.required ? ' (required)' : ''}: ${argument.description ?? 'No description.'}`).join('\n') : 'This prompt has no arguments.'}
`;
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function loadMcpSurface() {
  const packageJson = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const { createDomainMcpServer } = await import(
    pathToFileURL(join(PACKAGE_ROOT, 'dist', 'server.js')).href
  );
  const server = createDomainMcpServer(packageJson.version);
  const client = new Client({ name: 'domain-mcp-wiki', version: packageJson.version });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const [tools, resources, prompts] = await Promise.all([
      client.listTools(),
      client.listResources(),
      client.listPrompts(),
    ]);
    return {
      server: { name: 'domain-mcp', version: packageJson.version },
      tools: tools.tools,
      resources: resources.resources,
      prompts: prompts.prompts,
    };
  } finally {
    await client.close();
    await server.close();
  }
}

function renderIndex(surface) {
  return `---
title: Domain MCP Reference
description: Auto-generated reference for all Domain MCP tools, resources, and prompts.
slug: /
---

# Domain MCP reference

This reference is generated directly from the public Model Context Protocol surface of \`domain-mcp\` ${surface.server.version}. It documents ${surface.tools.length} tools, ${surface.resources.length} resources, and ${surface.prompts.length} prompts.

## Explore

- [Tools](/docs/tools/)
- [Resources](/docs/resources/)
- [Prompts](/docs/prompts/)
`;
}

function renderCollectionIndex(title, description, entries) {
  return `---
title: ${title}
description: ${description}
---

# ${title}

${description}

${entries.map(({ label, href, description: itemDescription }) => `- [\`${label}\`](${href}) — ${itemDescription ?? 'No description.'}`).join('\n')}
`;
}

function renderLlmsTxt(surface) {
  const links = [
    `# Domain MCP\n\n> AI-native domain management through the Model Context Protocol.`,
    `\n## Tools`,
    ...surface.tools.map(
      (tool) =>
        `- [${tool.name}](${SITE_URL}/docs/tools/${toolSlug(tool.name)}): ${tool.description ?? ''}`,
    ),
    `\n## Resources`,
    ...surface.resources.map(
      (resource) =>
        `- [${resource.name}](${SITE_URL}/docs/resources/${primitiveSlug(resource.name)}): ${resource.description ?? ''}`,
    ),
    `\n## Prompts`,
    ...surface.prompts.map(
      (prompt) =>
        `- [${prompt.name}](${SITE_URL}/docs/prompts/${primitiveSlug(prompt.name)}): ${prompt.description ?? ''}`,
    ),
  ];
  return `${links.join('\n')}\n`;
}

export async function generateWiki({
  outputDirectory,
  staticDirectory = outputDirectory,
  surface,
}) {
  await rm(outputDirectory, { recursive: true, force: true });
  if (staticDirectory !== outputDirectory)
    await rm(staticDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(staticDirectory, { recursive: true });

  await write(join(outputDirectory, 'index.md'), renderIndex(surface));
  await write(
    join(outputDirectory, 'tools', 'index.md'),
    renderCollectionIndex(
      'MCP tools',
      'The complete credential-free tool catalog exposed by Domain MCP.',
      surface.tools.map((tool) => ({
        label: tool.name,
        href: `/docs/tools/${toolSlug(tool.name)}`,
        description: tool.description,
      })),
    ),
  );
  for (const tool of surface.tools) {
    await write(join(outputDirectory, 'tools', `${toolSlug(tool.name)}.md`), renderToolPage(tool));
  }

  await write(
    join(outputDirectory, 'resources', 'index.md'),
    renderCollectionIndex(
      'MCP resources',
      'Read-only context resources available to connected MCP clients.',
      surface.resources.map((resource) => ({
        label: resource.name,
        href: `/docs/resources/${primitiveSlug(resource.name)}`,
        description: resource.description,
      })),
    ),
  );
  for (const resource of surface.resources) {
    await write(
      join(outputDirectory, 'resources', `${primitiveSlug(resource.name)}.md`),
      renderResourcePage(resource),
    );
  }

  await write(
    join(outputDirectory, 'prompts', 'index.md'),
    renderCollectionIndex(
      'MCP prompts',
      'Reusable workflows exposed through the Model Context Protocol.',
      surface.prompts.map((prompt) => ({
        label: prompt.name,
        href: `/docs/prompts/${primitiveSlug(prompt.name)}`,
        description: prompt.description,
      })),
    ),
  );
  for (const prompt of surface.prompts) {
    await write(
      join(outputDirectory, 'prompts', `${primitiveSlug(prompt.name)}.md`),
      renderPromptPage(prompt),
    );
  }

  const llmsTxt = renderLlmsTxt(surface);
  await write(join(staticDirectory, 'llms.txt'), llmsTxt);
  await write(
    join(staticDirectory, 'llms-full.txt'),
    `${llmsTxt}\n${surface.tools.map(renderToolPage).join('\n')}\n`,
  );
  await write(
    join(staticDirectory, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  );
  const imageDirectory = join(staticDirectory, 'img');
  await mkdir(imageDirectory, { recursive: true });
  await copyFile(join(REPOSITORY_ROOT, 'icon.png'), join(imageDirectory, 'icon.png'));
}

async function main() {
  const check = process.argv.includes('--check');
  const docsDirectory = resolve(REPOSITORY_ROOT, 'packages', 'wiki', 'docs');
  const staticDirectory = resolve(REPOSITORY_ROOT, 'packages', 'wiki', 'static');
  const temporaryRoot = resolve(REPOSITORY_ROOT, '.wiki-generated');
  const targetDocs = check ? join(temporaryRoot, 'docs') : docsDirectory;
  const targetStatic = check ? join(temporaryRoot, 'static') : staticDirectory;
  const surface = await loadMcpSurface();
  await generateWiki({ outputDirectory: targetDocs, staticDirectory: targetStatic, surface });

  if (check) {
    const { execFileSync } = await import('node:child_process');
    try {
      execFileSync('git', ['diff', '--no-index', '--exit-code', docsDirectory, targetDocs], {
        cwd: REPOSITORY_ROOT,
        stdio: 'inherit',
      });
      execFileSync('git', ['diff', '--no-index', '--exit-code', staticDirectory, targetStatic], {
        cwd: REPOSITORY_ROOT,
        stdio: 'inherit',
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
