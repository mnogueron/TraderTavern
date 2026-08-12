# Milestone 07 — Notification channels

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## User story

As a developer, I want to build a pluggable notification-delivery layer, so that I practice designing an interface that lets a new delivery mechanism be added later without touching existing code.

## What to decide and build yourself

- Design a `NotificationChannel`-style interface (and a registry for implementations) before writing the first concrete channel.
- Build the first channel implementation (e.g. a Discord webhook) and decide how its config and secrets are structured — remember secrets get encrypted via [Milestone 02](./02-secrets-management.md), never stored/returned as plaintext.
- Decide whether the app should support multiple destinations of the same channel type (e.g. two different Discord webhooks) and design accordingly.
- Decide how a user verifies a channel works before relying on it in a scheduled rule.

## Reference notes (peek only if stuck — try your own design first)

The delivery half of the notification pipeline, independent of bots.

- `NotificationChannel` interface, `ChannelRegistryService`
- `DiscordWebhookChannel` (HTTPS POST, Discord embed formatting, color-coded by sentiment/severity)
- **`ChannelConfig` schema (multiple destinations supported):** `{ name, type: 'discord', webhookUrl via SecretsService }`; the single user can create several named Discord channel configs (e.g. distinct webhooks for different Discord channels/servers), each independently manageable. `NotificationRule` ([Milestone 08](./08-bot-registry-scheduler.md)) selects one `ChannelConfig` by id (`channelConfigRef`) per rule.
- **Mentions:** `ChannelConfig` also stores an optional list of Discord mention targets (user IDs and/or role IDs) to prefix onto messages sent through it, e.g. `mentions: [{ type: 'user' | 'role', discordId }]`. Rendered as native Discord mentions (`<@id>` / `<@&id>`) outside the embed body so they actually ping. Since a rule selects a `ChannelConfig`, mention behavior is effectively per-destination for v1 (e.g. a "high-priority" `ChannelConfig` with mentions configured, vs. a quiet one without) rather than a separate per-rule override.
- REST controller (CRUD for `ChannelConfig`) + `POST /channel-configs/:id/test` (send a test message to a specific config on demand, including configured mentions)

## Definition of done

- Create two separate Discord `ChannelConfig`s pointing at different webhooks; the test endpoint on each posts to the correct, distinct Discord destination.
- Configure mentions (a user and a role) on a `ChannelConfig`; the test endpoint produces a real ping in Discord.
- Confirm the stored config never round-trips the raw URL through the REST API.
