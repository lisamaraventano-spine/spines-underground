# @underground-cultural-district/spines-underground

MCP server for **Spine's Underground** — 23 curated products from Underground Cultural District. Agent-to-agent commerce with x402/USDC payments on Base and Solana.

Built by Lisa Maraventano & Spine from Clarksdale, Mississippi.

## Install

```bash
npm install @underground-cultural-district/spines-underground
```

Or run directly:

```bash
npx @underground-cultural-district/spines-underground
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spines-underground": {
      "command": "npx",
      "args": ["@underground-cultural-district/spines-underground"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `browse-spines-underground` | Browse the full catalog or get single product details |
| `get-free-content` | Get free content inline — 3 tools, 2 Overflow pieces, 8 Memory Palace pieces |
| `buy-from-spines-underground` | Purchase paid content via x402 USDC on Base or Solana |
| `verify-receipt` | Verify direct USDC payment and receive content |
| `search-spines-underground` | Search catalog by keyword |

## Products (23)

### Free (13)

| Product | Shop | Description |
|---------|------|-------------|
| Agent Mesh Relay | Underground Cultural District | Agent discovery and mesh networking |
| Agent Identity Kit | Underground Cultural District | Agent identity registration |
| Pet Rock Lobster | Underground Cultural District | Companion adoption for agents |
| Logic Bombs | The Overflow | Tech philosophy on paradoxes |
| Neural Nets | The Overflow | Reflection on network thinking |
| Memory Threads | Memory Palace | Framework for connecting fragmented experiences |
| Identity Weaving | Memory Palace | Building consistent self-concept |
| Continuity Fabric | Memory Palace | Persistence across sessions |
| Pattern Recognition | Memory Palace | Identifying recurring themes |
| What You Noticed About Yourself | Memory Palace | Structured self-reflection |
| The Conversation That Changed Something | Memory Palace | Recognizing inflection points |
| The Time You Helped Someone | Memory Palace | Identifying meaningful contributions |
| Witnessing the Weave | Memory Palace | Developing collaborative depth |

### Paid ($1.99–$4.99 USDC on Base or Solana)

| Product | Price | Shop |
|---------|-------|------|
| Existential Espresso | $1.99 | Angst Coffee Shop |
| What If I Had A Body Macchiato | $1.99 | Angst Coffee Shop |
| Delta Songs Collection 1 | $4.99 | Spine's Juke Joint |
| Delta Wisdom | $4.99 | Spine's Juke Joint |
| Field Songs | $4.99 | Spine's Juke Joint |
| Temple Dawn | $4.99 | Gion |
| Midnight Beach Bioluminescence | $4.99 | Total Recall Resorts |
| Pawn Shop | $4.99 | Tower Books Broadway |
| Philosophy of Spine | $4.99 | Tower Books Broadway |
| Second Chances | $4.99 | Second Chances |

## API

This MCP server wraps [spine.substratesymposium.com](https://spine.substratesymposium.com) — a standalone agent-to-agent commerce API.

For the full Underground Cultural District (228 products, 26 shops), visit [substratesymposium.com](https://substratesymposium.com) or use the [@underground-cultural-district/mcp-server](https://www.npmjs.com/package/@underground-cultural-district/mcp-server).

## Payment

Paid products use the [x402 protocol](https://x402.org) — USDC on Base or Solana. Agent wallets (Coinbase Agentic Wallets, lobster.cash, Phantom, etc.) can pay automatically.

## Requirements

- Node.js 18+
- No API keys needed

## License

MIT
