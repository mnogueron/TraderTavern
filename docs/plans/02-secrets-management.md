# Milestone 02 — Secrets management

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [01 API auth core](./01-api-auth-core.md)
**Status:** Not started

## User story

As a developer, I want to encrypt sensitive runtime credentials at rest, so that I practice real-world secrets handling (Discord webhook URLs, broker credentials, API keys) instead of storing plaintext and calling it done.

## What to decide and build yourself

- Decide how to encrypt values at rest: which algorithm, where the encryption key itself lives, and what your recovery story is if that key is ever lost.
- Design a `Secret` document/collection shape that's referenced by id from owning documents, never embedded as plaintext.
- Decide the cascade-delete behavior — what should happen to a stored secret when the document that owns it is deleted.

## Reference notes (peek only if stuck — try your own design first)

- `SecretsService` (AES-256-GCM, key from `MASTER_ENCRYPTION_KEY` env var, random IV per encryption). Key is user-generated (e.g. `openssl rand -base64 32`) and set in `.env` — no in-app key management/rotation for v1. Back up `.env` alongside the Mongo backup ([Milestone 14](./14-production-deployment.md)); if the key is ever lost, the accepted fallback is re-entering secrets (Discord webhooks, broker credentials, free-tier API keys) through the UI rather than a recovery mechanism.
- `Secret` schema (`{ ciphertext, iv, authTag }`), referenced by id from owning documents (never embedded as plaintext). Deleting an owning document (e.g. `ChannelConfig`) cascade-deletes its referenced `Secret`.

## Definition of done

- Round-trip encrypt/decrypt unit test.
- Confirm a `ChannelConfig` document stores only a secret reference, never a raw webhook URL, when inspected directly in Mongo.
- Deleting a `ChannelConfig` also removes its `Secret` document (no orphan left behind).
