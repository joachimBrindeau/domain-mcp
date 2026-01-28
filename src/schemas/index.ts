/**
 * Schema exports for all Dynadot MCP tools
 * Split from monolithic schema.ts for better maintainability
 */

import { accountTool } from './account.js';
import { aftermarketTool } from './aftermarket.js';
import type { CompositeTool } from './common.js';
import { contactTool } from './contact.js';
import { dnsTool } from './dns.js';
import { domainTool } from './domain.js';
import { domainSettingsTool } from './domain-settings.js';
import { folderTool } from './folder.js';
import { nameserverTool } from './nameserver.js';
import { orderTool } from './order.js';
import { transferTool } from './transfer.js';

export const compositeTools: CompositeTool[] = [
  domainTool,
  domainSettingsTool,
  dnsTool,
  nameserverTool,
  transferTool,
  contactTool,
  folderTool,
  accountTool,
  aftermarketTool,
  orderTool,
];
