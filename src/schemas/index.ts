/**
 * Schema exports for all Dynadot MCP tools
 * Split from monolithic schema.ts for better maintainability
 */

import type { CompositeTool } from './common.js';
import { domainTool } from './domain.js';
import { domainSettingsTool } from './domain-settings.js';
import { dnsTool } from './dns.js';
import { nameserverTool } from './nameserver.js';
import { transferTool } from './transfer.js';
import { contactTool } from './contact.js';
import { folderTool } from './folder.js';
import { accountTool } from './account.js';
import { aftermarketTool } from './aftermarket.js';
import { orderTool } from './order.js';

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
