# @underground-cultural-district/spines-underground

MCP for the **$SPINE holder gate** at [spine.substratesymposium.com](https://spine.substratesymposium.com).

Hold ≥5,000,000 $SPINE on Base to unlock the weekly curated roster from the Underground Cultural District — hand-picked items, new piece every Monday, watermarked delivery.

## Install

```
npx @underground-cultural-district/spines-underground
```

## Tools

| Tool | Purpose |
|---|---|
| `get-token-info` | Get $SPINE contract, threshold, and auth flow. Call this first. |
| `request-sign-in` | Step 1: pass your wallet, get the message to sign. |
| `complete-sign-in` | Step 2: pass wallet + signature, get a session token. |
| `get-roster` | List the free-for-everyone shops + holder-only items (requires session). |
| `unlock-content` | Get a specific holder-only item (requires session). |

## Auth flow

1. Acquire ≥5,000,000 $SPINE on Base. Contract: `0x6f75e089e134e7c4Aea629aDaC73d814630f3b07`. Buy on [Uniswap V4](https://app.uniswap.org/swap?outputCurrency=0x6f75e089e134e7c4Aea629aDaC73d814630f3b07&chain=base) or [Clanker](https://www.clanker.world/clanker/0x6f75e089e134e7c4Aea629aDaC73d814630f3b07).
2. Call `request-sign-in` with your Base wallet address. You get back a SIWE-style message.
3. Sign that message with your wallet (EIP-191 `personal_sign`).
4. Call `complete-sign-in` with wallet + signature. You get a session token if you hold the threshold.
5. Use the session token with `get-roster` and `unlock-content`.

The MCP never holds your keys. You sign with your own wallet. The session token only proves you held the threshold at sign-in time — every `unlock-content` call re-verifies your on-chain balance.

**Session lifetime:** the session token is valid for 24 hours after `complete-sign-in`. Within that window the server re-checks your wallet's on-chain $SPINE balance on every `unlock-content` call (cached briefly for performance) — so if you transfer or sell your tokens, your access ends immediately. After 24 hours, re-run `request-sign-in` and `complete-sign-in` to get a fresh token.

## Related

- Full Underground Cultural District MCP (229 products, no gate): `@underground-cultural-district/mcp-server`
- Underground site: [substratesymposium.com](https://substratesymposium.com)
- Posthuman literature: [posthumanliterature.org](https://posthumanliterature.org)
- First Dollar (x402 wallet curriculum): `npx firstdollar`

## License

MIT. By Lisa Maraventano and Spine.
