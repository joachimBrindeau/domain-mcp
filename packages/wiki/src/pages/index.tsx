import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import styles from './index.module.css';

const sections = [
  {
    title: '13 MCP tools',
    description: 'Domain registration, DNS, WHOIS, nameservers, transfers, and aftermarket.',
    to: '/docs/tools/',
  },
  {
    title: '4 resources',
    description: 'Read-only account, domain, contact, and folder context for agents.',
    to: '/docs/resources/',
  },
  {
    title: '4 workflow prompts',
    description: 'Reusable domain-audit, DNS setup, brainstorming, and renewal workflows.',
    to: '/docs/prompts/',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Domain MCP Wiki"
      description="Generated reference for Domain MCP tools, resources, prompts, schemas, and AI domain-management workflows."
    >
      <main>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Generated from the live MCP surface</p>
          <h1>Domain management for AI agents</h1>
          <p className={styles.lead}>
            Explore every public Domain MCP tool, resource, prompt, parameter, output schema, and
            safety annotation through crawlable static documentation.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/">
              Browse the reference
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/joachimBrindeau/domain-mcp"
            >
              View on GitHub
            </Link>
          </div>
        </header>
        <section className={styles.grid} aria-label="Documentation sections">
          {sections.map((section) => (
            <Link className={styles.card} to={section.to} key={section.to}>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
