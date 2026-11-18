# APEONX 1000× website

A responsive, static community website for the APEONX Solana token. The site uses the campaign artwork supplied by the project and links directly to the supplied token and community destinations.

## Included

- Responsive landing page with mobile navigation and an accessible skip link.
- Token information and a copyable Solana contract address.
- Live token-pair lookup using the public DexScreener token-pairs API. The highest-liquidity APEONX pool is selected; no local sample values are substituted when the API returns no pair.
- DexScreener chart embed, activated only after a pool URL is returned by the API.
- Countdown to 14 December 2026 for the stated creator-held token lock.
- Explicit disclosure that the 20,000,000 token lock is project-reported and not independently verified on this site. The lock wallet and on-chain proof have not been supplied.
- Risk disclosure: “1000×” is branding, not a return promise.
- Security headers and GitHub Actions checks.

## Local development

This is a dependency-free static site. Serve this directory with any static HTTP server, for example:

    python -m http.server 8080

Then open http://localhost:8080.

## Checks

Run npm test.

The check script validates required project information, links, market-data integration, artwork, accessibility hooks and unresolved placeholders. GitHub Actions runs the same check on pushes and pull requests to main.

## Deployment

The project is configured for Vercel static hosting. No custom domain is required; connect a domain later through the Vercel project settings.

## Data and verification notes

- Contract address, Telegram link, X handle and the 20,000,000 / 14 December 2026 lock statement were supplied by the project contact.
- Market values are fetched at runtime from DexScreener. API availability, pool indexing and market data are controlled by the third party.
- The stated lock is not presented as proven on-chain. Add the lock wallet and verifiable transaction or locker link only after those details are provided and independently checked.
- This website does not connect wallets, request signatures, custody assets or execute swaps.