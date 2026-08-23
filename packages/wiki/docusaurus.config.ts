import type { Options, ThemeConfig } from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Domain MCP Wiki',
  tagline: 'AI-native domain management through the Model Context Protocol',
  favicon: 'img/icon.png',
  url: 'https://joachimbrindeau.github.io',
  baseUrl: '/domain-mcp/',
  organizationName: 'joachimBrindeau',
  projectName: 'domain-mcp',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onDuplicateRoutes: 'throw',
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Domain MCP',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cross-platform',
        codeRepository: 'https://github.com/joachimBrindeau/domain-mcp',
        license: 'https://opensource.org/license/mit',
        description:
          'Model Context Protocol server for domain registration, DNS, WHOIS, transfers, and portfolio management.',
      }),
    },
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/joachimBrindeau/domain-mcp/edit/main/packages/wiki/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Options,
    ],
  ],
  themeConfig: {
    image: 'img/icon.png',
    metadata: [
      { name: 'keywords', content: 'MCP, domain management, DNS, Dynadot, AI agents' },
      { name: 'twitter:card', content: 'summary' },
    ],
    navbar: {
      title: 'Domain MCP',
      logo: { alt: 'Domain MCP logo', src: 'img/icon.png' },
      items: [
        { type: 'docSidebar', sidebarId: 'reference', position: 'left', label: 'Reference' },
        {
          href: 'https://github.com/joachimBrindeau/domain-mcp',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://smithery.ai/servers/joachim-brindeau/domain-mcp',
          label: 'Smithery',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Reference',
          items: [
            { label: 'Tools', to: '/docs/tools/' },
            { label: 'Resources', to: '/docs/resources/' },
            { label: 'Prompts', to: '/docs/prompts/' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/joachimBrindeau/domain-mcp' },
            {
              label: 'MCP Registry',
              href: 'https://registry.modelcontextprotocol.io/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Joachim Brindeau. Generated from the live MCP surface.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies ThemeConfig,
};

export default config;
