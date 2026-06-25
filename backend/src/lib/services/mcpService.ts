import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MCPService');

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport: 'stdio' | 'sse';
  tools?: string[];
}

export class MCPService {
  private servers: Map<string, MCPServerConfig> = new Map();

  registerServer(config: MCPServerConfig) {
    this.servers.set(config.name, config);
    logger.info(`Registered MCP server: ${config.name}`);
  }

  getServer(name: string): MCPServerConfig | undefined {
    return this.servers.get(name);
  }

  getAllServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  removeServer(name: string): boolean {
    return this.servers.delete(name);
  }
}

let mcpInstance: MCPService | null = null;

export function getMCPService(): MCPService {
  if (!mcpInstance) {
    mcpInstance = new MCPService();
  }
  return mcpInstance;
}
