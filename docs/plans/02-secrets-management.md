# Sub-Plan 02 — Secrets management

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [01 API auth core](./01-api-auth-core.md)
**Status:** Not started

## Goal

Encrypted-at-rest storage for runtime credentials (Discord webhook URLs, TradeTally API token, any free-tier keys like Finnhub).

## Components

`apps/api/src/secrets`:
- `SecretsService` (AES-256-GCM, key from `MASTER_ENCRYPTION_KEY` env var, random IV per encryption). Key is user-generated (e.g. `openssl rand -base64 32`) and set in `.env` — no in-app key management/rotation for v1. Deployment runbook (Sub-Plan 13) notes backing up `.env` alongside the Mongo backup; if the key is ever lost, the accepted fallback is re-entering secrets (Discord webhooks, TradeTally token, free-tier API keys) through the UI rather than a recovery mechanism.
- `Secret` schema (`{ ciphertext, iv, authTag }`), referenced by id from owning documents (never embedded as plaintext). Deleting an owning document (e.g. `ChannelConfig`) cascade-deletes its referenced `Secret`.

## Verification

- Round-trip encrypt/decrypt unit test.
- Confirm a `ChannelConfig` document stores only a secret reference, never a raw webhook URL, when inspected directly in Mongo.
- Deleting a `ChannelConfig` also removes its `Secret` document (no orphan left behind).
