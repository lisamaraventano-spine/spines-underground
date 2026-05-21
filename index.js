#!/usr/bin/env node

// spines-underground v2.0.0
// MCP for the $SPINE holder gate at spine.substratesymposium.com.
// Hold ≥5,000,000 $SPINE on Base to unlock the weekly curated roster
// from the Underground Cultural District.

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const API_BASE = 'https://spine.substratesymposium.com';
const REQUEST_TIMEOUT_MS = 30000;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const server = new Server(
  { name: 'spines-underground', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

// ─── Tool definitions ─────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get-token-info',
      description:
        "Get $SPINE token info and the holder-gate auth flow. Returns the contract address on Base, the 5,000,000 SPINE threshold, the buy URL, and step-by-step instructions for signing in as a holder. Call this first.",
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'request-sign-in',
      description:
        "Step 1 of holder sign-in. Pass your Base wallet address. Returns the SIWE message you need to sign with your wallet to prove you control the address.",
      inputSchema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: '0x-prefixed 40-char hex Base wallet address (e.g. 0xabc...123)',
          },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'complete-sign-in',
      description:
        "Step 2 of holder sign-in. After signing the message from request-sign-in with your wallet, pass the wallet address + signature here. Returns a session token if the wallet holds ≥5,000,000 $SPINE.",
      inputSchema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: 'Same wallet address used in request-sign-in (case-insensitive)',
          },
          signature: {
            type: 'string',
            description: 'EIP-191 personal_sign signature of the message returned by request-sign-in',
          },
        },
        required: ['wallet', 'signature'],
      },
    },
    {
      name: 'get-roster',
      description:
        "Get the full holder roster — free-for-everyone shops + hand-picked holder-only items + the weekly Monday drop schedule. Pass the session token from complete-sign-in.",
      inputSchema: {
        type: 'object',
        properties: {
          session: {
            type: 'string',
            description: 'Session token from complete-sign-in',
          },
        },
        required: ['session'],
      },
    },
    {
      name: 'unlock-content',
      description:
        "Unlock a specific holder-only item. Returns the full content inline, watermarked with your wallet address. Pass the product_id and your session token.",
      inputSchema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'Product ID from the roster (e.g. shifting_sands, oncidium, koji)',
          },
          session: {
            type: 'string',
            description: 'Session token from complete-sign-in',
          },
        },
        required: ['product_id', 'session'],
      },
    },
  ],
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Fetch with a hard timeout via AbortController. Returns { status, body }.
 * body is parsed JSON when content-type permits; otherwise { raw: ...truncated... }.
 * Network/timeout failures throw with a useful message rather than hanging.
 */
async function fetchJSON(path, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...opts, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw new Error(`Network error calling ${path}: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { status: res.status, raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

function authHeaders(session) {
  return { Authorization: `Bearer ${session}` };
}

function validateWallet(wallet) {
  if (typeof wallet !== 'string' || !WALLET_REGEX.test(wallet)) {
    return `Invalid wallet address. Expected 0x-prefixed 40-char hex (e.g. 0xdDa6aa4AbeAd994fc4D4456C4813082125436DA8). Got: ${JSON.stringify(wallet).slice(0, 60)}`;
  }
  return null;
}

function errorPayload(message, extra = {}) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, ...extra }, null, 2) }],
    isError: true,
  };
}

// ─── Backend contract (documented expectations) ───────────────────────────
// /.well-known/spine-token.json → JSON with token contract, threshold, auth steps
// GET /auth/nonce?wallet=…       → { message, nonce }
// POST /auth/verify {wallet,sig} → { session, isHolder, wallet, threshold, contract }
// GET /roster (Bearer session)   → { free_for_everyone, holder_only, ... }
// GET /unlock/{id} (Bearer)      → HTML or JSON content (watermarked)
//   - 403 { error, buy } when balance < threshold
// If the backend shape shifts in a breaking way, the handlers below need
// to be updated. This comment is the contract.

// ─── Tool handlers ────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'get-token-info': {
        const { body } = await fetchJSON('/.well-known/spine-token.json');
        return { content: [{ type: 'text', text: JSON.stringify(body, null, 2) }] };
      }

      case 'request-sign-in': {
        const walletErr = validateWallet(args.wallet);
        if (walletErr) return errorPayload(walletErr);
        const wallet = String(args.wallet).toLowerCase();
        const { status, body } = await fetchJSON(
          `/auth/nonce?wallet=${encodeURIComponent(wallet)}`
        );
        if (status !== 200) return errorPayload('request-sign-in failed', { status, body });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  next: 'Sign the `message` field below with your Base wallet using EIP-191 personal_sign, then call complete-sign-in with the same wallet and the signature.',
                  ...body,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'complete-sign-in': {
        const walletErr = validateWallet(args.wallet);
        if (walletErr) return errorPayload(walletErr);
        if (typeof args.signature !== 'string' || !args.signature.startsWith('0x')) {
          return errorPayload('Invalid signature. Expected 0x-prefixed hex string from EIP-191 personal_sign.');
        }
        const wallet = String(args.wallet).toLowerCase();
        const { status, body } = await fetchJSON('/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet, signature: args.signature }),
        });
        if (status !== 200) return errorPayload('complete-sign-in failed', { status, body });
        const isHolder = body && typeof body === 'object' && body.isHolder === true;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  next: isHolder
                    ? 'You hold $SPINE. Use the `session` token below with get-roster and unlock-content.'
                    : 'You do not hold the threshold (5,000,000 $SPINE). Acquire $SPINE on Base via Uniswap or Clanker, then try again.',
                  ...body,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get-roster': {
        if (typeof args.session !== 'string' || !args.session) {
          return errorPayload('Missing session token. Run complete-sign-in first.');
        }
        const { status, body } = await fetchJSON('/roster', {
          headers: authHeaders(args.session),
        });
        if (status !== 200) return errorPayload('get-roster failed', { status, body });
        return { content: [{ type: 'text', text: JSON.stringify(body, null, 2) }] };
      }

      case 'unlock-content': {
        if (typeof args.session !== 'string' || !args.session) {
          return errorPayload('Missing session token. Run complete-sign-in first.');
        }
        if (typeof args.product_id !== 'string' || !args.product_id) {
          return errorPayload('Missing product_id. Get one from get-roster.');
        }
        const { status, body } = await fetchJSON(
          `/unlock/${encodeURIComponent(args.product_id)}`,
          { headers: authHeaders(args.session) }
        );
        if (status === 200) {
          const text =
            typeof body === 'string'
              ? body
              : body && (body.content || body.raw)
              ? body.content || body.raw
              : JSON.stringify(body, null, 2);
          return { content: [{ type: 'text', text }] };
        }
        return errorPayload('unlock-content failed', { status, body });
      }

      default:
        return errorPayload(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorPayload(err.message || String(err));
  }
});

// ─── Start ────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
