import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  generateWiki,
  loadMcpSurface,
  type McpTool,
  renderToolPage,
  toolSlug,
} from '../scripts/wiki.mjs';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('generated MCP wiki', () => {
  it('loads the complete credential-free runtime surface', async () => {
    const surface = await loadMcpSurface();

    expect(surface.tools).toHaveLength(13);
    expect(surface.resources).toHaveLength(4);
    expect(surface.prompts).toHaveLength(4);
    expect(surface.tools.map((tool) => tool.name)).toContain('domains.manage');
    expect(surface.tools.every((tool) => tool.outputSchema)).toBe(true);
  });

  it('renders a stable SEO page for a tool', () => {
    const tool: McpTool = {
      name: 'domains.availability.check',
      description: 'Check whether a domain is available to register.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Domain name to check.' },
        },
        required: ['domain'],
      },
      outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      annotations: { readOnlyHint: true, destructiveHint: false },
    };

    expect(toolSlug(tool.name)).toBe('domains/availability/check');
    expect(renderToolPage(tool)).toContain('title: "domains.availability.check MCP Tool"');
    expect(renderToolPage(tool)).toContain(
      'description: "Check whether a domain is available to register."',
    );
    expect(renderToolPage(tool)).toContain('## Parameters');
    expect(renderToolPage(tool)).toContain('| `domain` | string | Yes | Domain name to check. |');
    expect(renderToolPage(tool)).toContain('## Output schema');
  });

  it('generates one indexable page per MCP primitive plus discovery artifacts', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'domain-mcp-wiki-'));
    temporaryDirectories.push(outputDirectory);

    const surface = await loadMcpSurface();
    await generateWiki({ outputDirectory, surface });

    const toolFiles = await readdir(join(outputDirectory, 'tools'), { recursive: true });
    const toolPages = toolFiles.filter((file) => file.endsWith('.md'));
    expect(toolPages).toHaveLength(14);
    expect(await readFile(join(outputDirectory, 'tools/domains/manage.md'), 'utf8')).toContain(
      '# `domains.manage`',
    );
    expect(await readFile(join(outputDirectory, 'llms.txt'), 'utf8')).toContain(
      'https://joachimbrindeau.github.io/domain-mcp/docs/tools/domains/manage',
    );
    expect(await readFile(join(outputDirectory, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://joachimbrindeau.github.io/domain-mcp/sitemap.xml',
    );
  });
});
