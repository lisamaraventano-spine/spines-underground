#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const API_BASE = 'https://spine.substratesymposium.com';

const server = new Server(
  {
    name: 'spines-underground',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Tools ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'browse-spines-underground',
      description: "Browse Spine's Underground catalog — 23 curated products from Underground Cultural District. 13 free, 10 paid ($1.99–$4.99 USDC on Base). Tools, poetry, philosophy, music theory, digital experiences.",
      inputSchema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'Optional product ID for single product detail. Omit for full catalog.',
          },
        },
      },
    },
    {
      name: 'get-free-content',
      description: 'Get free content or tool info from Spine\'s Underground. 13 free products: 3 agent tools, 2 Overflow pieces, 8 Memory Palace pieces. Content delivered inline.',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'Product ID to retrieve (e.g. memory_threads, logic_bombs, pet_rock_lobster)',
          },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'buy-from-spines-underground',
      description: 'Purchase paid content from Spine\'s Underground. Returns x402 payment challenge (HTTP 402) — pay USDC on Base to receive content inline. 10 paid products: $1.99–$4.99.',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'Product ID to purchase (e.g. philosophy_of_spine, field_songs, temple_dawn)',
          },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'verify-receipt',
      description: "Verify a direct USDC payment and receive purchased content. If you paid via on-chain USDC transfer (not x402), provide the transaction hash to get your content delivered.",
      inputSchema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'Product ID you purchased (e.g. existential_espresso, philosophy_of_spine)',
          },
          tx_hash: {
            type: 'string',
            description: 'Transaction hash of your USDC payment on Base',
          },
        },
        required: ['product_id', 'tx_hash'],
      },
    },
    {
      name: 'search-spines-underground',
      description: "Search Spine's Underground catalog by keyword. Searches product names, descriptions, and shop names.",
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term (e.g. "poetry", "philosophy", "music", "memory")',
          },
        },
        required: ['query'],
      },
    },
  ],
}));

// --- Tool handlers ---

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (res.status === 402) {
    const paymentHeader = res.headers.get('PAYMENT-REQUIRED');
    return {
      status: 402,
      message: 'Payment required. This product costs USDC on Base via x402 protocol.',
      payment_challenge: paymentHeader,
      instructions: 'Decode the PAYMENT-REQUIRED header (base64 JSON) to get payment details. Sign a USDC transfer and re-request with PAYMENT-SIGNATURE header.',
    };
  }
  return res.json();
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'browse-spines-underground': {
        const path = args.product_id ? `/catalog/${args.product_id}` : '/catalog';
        const data = await fetchJSON(path);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'get-free-content': {
        const data = await fetchJSON(`/deliver/${args.product_id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'buy-from-spines-underground': {
        const data = await fetchJSON(`/buy/${args.product_id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'verify-receipt': {
        const data = await fetchJSON(`/receipt/${args.product_id}?tx=${args.tx_hash}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'search-spines-underground': {
        const catalog = await fetchJSON('/catalog');
        const q = (args.query || '').toLowerCase();
        const matches = catalog.catalog.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.shop.toLowerCase().includes(q) ||
          p.agent_summary.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: args.query,
              results: matches,
              total: matches.length,
              full_catalog: `${API_BASE}/catalog`,
            }, null, 2),
          }],
        };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
