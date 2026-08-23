#!/usr/bin/env node

import { Project, SyntaxKind } from 'ts-morph';

const renames = new Map([
  ['domain', 'domains.manage'],
  ['domain_settings', 'domains.settings.manage'],
  ['dns', 'dns.manage'],
  ['nameserver', 'nameservers.manage'],
  ['transfer', 'transfers.manage'],
  ['contact', 'contacts.manage'],
  ['folder', 'folders.manage'],
  ['account', 'account.manage'],
  ['aftermarket', 'aftermarket.manage'],
  ['order', 'orders.manage'],
  ['check_domain', 'domains.availability.check'],
  ['generate_domain_ideas', 'domains.ideas.generate'],
  ['help', 'server.help'],
]);

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const sourceFiles = project.getSourceFiles(['src/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts']);
let replacements = 0;

for (const sourceFile of sourceFiles) {
  for (const literal of sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
    const replacement = renames.get(literal.getLiteralValue());
    if (!replacement) continue;
    const parent = literal.getParent();
    const isPublicToolName =
      parent?.isKind(SyntaxKind.PropertyAssignment) && parent.getName() === 'name';
    const isRegisterToolName =
      parent?.isKind(SyntaxKind.CallExpression) &&
      parent.getExpression().getText().endsWith('registerTool') &&
      parent.getArguments()[0] === literal;
    if (!isPublicToolName && !isRegisterToolName) continue;
    literal.setLiteralValue(replacement);
    replacements += 1;
  }
}

await project.save();
console.log(
  `Updated ${replacements} TypeScript string literals across ${sourceFiles.length} files.`,
);
