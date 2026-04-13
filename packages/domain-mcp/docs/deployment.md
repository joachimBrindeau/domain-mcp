# Domain MCP Server Deployment Guide

Deploy the Domain MCP server for AI-powered domain management across local, Docker, remote, and serverless environments.

## Deployment Options Overview

| Deployment Type | Use Case | Complexity | Security |
|----------------|----------|------------|----------|
| **Local (stdio)** | Personal use, single user | ⭐ Easy | 🔒 Local only |
| **Docker Local** | Team development | ⭐⭐ Medium | 🔒 Local network |
| **Remote Server** | Multi-user, production | ⭐⭐⭐ Advanced | 🔒🔒 OAuth required |
| **Serverless** | Scalable, managed | ⭐⭐⭐ Advanced | 🔒🔒 Platform managed |

## 1. Local Deployment (Current Setup)

**✅ What we've already configured** - This is the simplest and most common deployment for personal use.

### How It Works

```
┌─────────────────┐
│  Claude Code    │  Launches local process
│  Cursor         │  via stdio (stdin/stdout)
│  Claude Desktop │
└────────┬────────┘
         │
         │ stdio
         │
         ▼
┌─────────────────┐
│  node dist/     │  Runs on your machine
│  index.js       │  Accesses your API key
└─────────────────┘
```

### Configuration

Already documented in [MCP_CLIENT_SETUP.md](MCP_CLIENT_SETUP.md):

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": ["/absolute/path/to/domain-mcp/dist/index.js"],
      "env": {
        "DYNADOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Pros & Cons

✅ **Pros:**
- Simplest setup
- No network exposure
- Direct API key access
- Fast (no network latency)
- Works with all MCP clients

❌ **Cons:**
- Single user only
- No remote access
- Must run on same machine
- API key stored locally

**📌 Recommendation: Use this for personal projects** (which is your case!)

## 2. Docker Local Deployment

For teams or better isolation, you can containerize the MCP server.

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Set environment variable placeholder
ENV DYNADOT_API_KEY=""

# Run the server
CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
# Build image
docker build -t domain-mcp .

# Run container
docker run -it --rm \
  -e DYNADOT_API_KEY="your-api-key" \
  domain-mcp
```

### MCP Client Configuration

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "DYNADOT_API_KEY=your-api-key",
        "domain-mcp"
      ]
    }
  }
}
```

### Pros & Cons

✅ **Pros:**
- Isolated environment
- Reproducible builds
- Easy distribution
- Works on any platform

❌ **Cons:**
- Requires Docker installed
- Slightly slower startup
- Still local only
- More complex setup

## 3. Remote Server Deployment

Deploy the MCP server to a cloud server for team access.

### 3.1 Basic Remote Setup

**Note:** MCP stdio-based servers (like ours) need adaptation for remote access. You have two options:

#### Option A: Use mcp-remote Bridge

The [mcp-remote](https://github.com/geelen/mcp-remote) bridge allows stdio servers to work remotely.

```bash
# On server
npm install -g mcp-remote
mcp-remote serve --command "node /path/to/dist/index.js"
```

```json
// On client
{
  "mcpServers": {
    "dynadot": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "connect",
        "https://your-server.com/mcp"
      ]
    }
  }
}
```

#### Option B: Convert to HTTP/SSE Server

Modify `src/index.ts` to support HTTP/SSE protocol (advanced - requires code changes).

### 3.2 Cloud Platform Deployment

#### AWS Deployment

Using AWS Lambda + API Gateway:

1. **Package for Lambda:**
```bash
npm run build
zip -r domain-mcp.zip dist/ node_modules/ package.json
```

2. **Deploy to Lambda:**
- Runtime: Node.js 18.x
- Handler: dist/index.handler (requires adapting index.ts)
- Environment: DYNADOT_API_KEY
- Timeout: 30 seconds

3. **Setup API Gateway:**
- REST API with Lambda proxy integration
- Enable CORS
- Add authentication (API key or OAuth)

#### Cloudflare Workers

See [Cloudflare's guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) for deploying MCP servers.

```bash
npm install -g wrangler
wrangler deploy
```

#### DigitalOcean App Platform

Simple deployment with managed hosting:

1. Connect GitHub repository
2. Set environment variables
3. Deploy with one click

See [DigitalOcean's MCP guide](https://www.digitalocean.com/community/tutorials/claude-code-mcp-server).

### 3.3 Security Considerations

When deploying remotely:

⚠️ **Required Security Measures:**

1. **Authentication:** OAuth 2.0 or API keys
2. **HTTPS:** TLS certificates (Let's Encrypt)
3. **Rate Limiting:** Prevent abuse
4. **IP Whitelisting:** Restrict access
5. **Secret Management:** Use AWS Secrets Manager, HashiCorp Vault
6. **Monitoring:** Track usage and errors

### Pros & Cons

✅ **Pros:**
- Multi-user access
- Team collaboration
- Centralized management
- Access from anywhere

❌ **Cons:**
- Complex setup
- Security requirements
- Hosting costs
- Network latency

## 4. Serverless Deployment

Deploy as a serverless function for automatic scaling.

### Platforms

| Platform | Best For | Pricing |
|----------|----------|---------|
| AWS Lambda | Enterprise | Free tier, then pay-per-use |
| Cloudflare Workers | Global edge | Free tier generous |
| Vercel Functions | Modern apps | Free tier, then per-function |
| Google Cloud Run | Containers | Pay per request |

### Example: Cloudflare Workers

**Note:** Requires adapting the code to Cloudflare's runtime.

```javascript
// worker.js (simplified)
export default {
  async fetch(request, env) {
    // Handle MCP protocol over HTTP
    // Access env.DYNADOT_API_KEY
  }
}
```

Deploy:
```bash
wrangler publish
```

### Pros & Cons

✅ **Pros:**
- Auto-scaling
- Pay per use
- Managed infrastructure
- Global distribution

❌ **Cons:**
- Cold starts
- Platform lock-in
- Requires code adaptation
- Learning curve

## Current Deployment Status

### ✅ What's Already Set Up

Your Domain MCP server is **production-ready** for:

1. **Local deployment** (stdio) - Documented in MCP_CLIENT_SETUP.md
2. **npm package** - Ready to publish and use via `npx`
3. **Docker** - Can be containerized with minimal effort

### 🔨 What Would Need Work for Remote Deployment

To deploy remotely, you would need to:

1. **Add HTTP/SSE transport** - Modify index.ts to support remote protocols
2. **Implement authentication** - Add OAuth or API key validation
3. **Add HTTPS** - Set up TLS certificates
4. **Update client configuration** - Use HTTP endpoints instead of stdio
5. **Deploy to a platform** - Choose AWS, Cloudflare, etc.

## Recommended Deployment Strategy

### For Your Use Case (Solo Developer)

**✅ Stick with Local Deployment**

You've already set this up perfectly in MCP_CLIENT_SETUP.md:
- Simple configuration
- No hosting costs
- Direct API key access
- Works with Claude Code, Cursor, Claude Desktop

### If You Need Team Access Later

**Consider these progressive steps:**

1. **Publish to npm** - Team members can install via `npx`
2. **Docker image** - Share via Docker Hub
3. **Remote server** - Deploy to Cloudflare Workers or AWS Lambda

## Additional Resources

### Official Documentation
- [Model Context Protocol Docs](https://modelcontextprotocol.io/docs/develop/build-server)
- [Claude Desktop MCP Guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

### Deployment Guides
- [Northflank: Deploy MCP Server](https://northflank.com/blog/how-to-build-and-deploy-a-model-context-protocol-mcp-server)
- [Docker: Build MCP Servers](https://www.docker.com/blog/build-to-prod-mcp-servers-with-docker/)
- [AWS: MCP Server Guidance](https://aws.amazon.com/solutions/guidance/deploying-model-context-protocol-servers-on-aws/)
- [Cloudflare: Remote MCP Server](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)

### Community Resources
- [Production-Ready MCP Servers](https://dev.to/raghavajoijode/production-ready-mcp-servers-security-performance-deployment-5e48)
- [How MCP Servers Actually Work](https://jstoppa.com/posts/how-mcp-servers-actually-work-in-claude-cursor-and-what-can-you-do-with-them/post/)
- [MCP Across Different Platforms](https://dev.to/darkmavis1980/understanding-mcp-servers-across-different-platforms-claude-desktop-vs-vs-code-vs-cursor-4opk)

### Remote MCP Tools
- [mcp-remote Bridge](https://github.com/geelen/mcp-remote) - Connect stdio servers to remote clients

## Summary

**For your project as a solo developer:**

✅ **You're done!** Your current local deployment setup is perfect for:
- Personal use
- Quick development
- Testing and experimentation
- Sharing via npm package

📦 **Next steps (optional):**
- Publish to npm for easy installation
- Create Docker image for portability
- Consider remote deployment only if you need team collaboration

**Your local deployment is production-ready and perfectly suitable for a personal/open-source project!**

---

**Sources:**
- [Milvus: Deploy MCP Server](https://milvus.io/ai-quick-reference/whats-the-best-way-to-deploy-an-model-context-protocol-mcp-server-to-production)
- [Northflank: Build and Deploy MCP](https://northflank.com/blog/how-to-build-and-deploy-a-model-context-protocol-mcp-server)
- [Docker: MCP with Docker](https://www.docker.com/blog/build-to-prod-mcp-servers-with-docker/)
- [AWS: MCP Guidance](https://aws.amazon.com/solutions/guidance/deploying-model-context-protocol-servers-on-aws/)
- [Cloudflare: Remote MCP](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- [DEV: Understanding MCP Platforms](https://dev.to/darkmavis1980/understanding-mcp-servers-across-different-platforms-claude-desktop-vs-vs-code-vs-cursor-4opk)
- [Collabnix: MCP in Production](https://collabnix.com/how-to-use-mcp-in-production-a-practical-guide/)
