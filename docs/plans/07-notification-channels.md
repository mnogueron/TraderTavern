# Sub-Plan 07 — Notification channels

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## Goal

The delivery half of the notification pipeline, independent of bots.

## Components

`apps/api/src/notifications/channels` module:
- `NotificationChannel` interface, `ChannelRegistryService`
- `DiscordWebhookChannel` (HTTPS POST, Discord embed formatting, color-coded by sentiment/severity)
- **`ChannelConfig` schema (confirmed with user: multiple destinations)** — `{ name, type: 'discord', webhookUrl via SecretsService }`; the single user can create several named Discord channel configs (e.g. distinct webhooks for different Discord channels/servers), each independently manageable. `NotificationRule` ([Sub-Plan 08](./08-bot-registry-scheduler.md)) selects one `ChannelConfig` by id (`channelConfigRef`) per rule.
- **Mentions (confirmed with user):** `ChannelConfig` also stores an optional list of Discord mention targets (user IDs and/or role IDs) to prefix onto messages sent through it, e.g. `mentions: [{ type: 'user' | 'role', discordId }]`. Rendered as native Discord mentions (`<@id>` / `<@&id>`) outside the embed body so they actually ping. Since a rule selects a `ChannelConfig`, mention behavior is effectively per-destination for v1 (e.g. a "high-priority" `ChannelConfig` with mentions configured, vs. a quiet one without) rather than a separate per-rule override.
- Resolvers (CRUD for `ChannelConfig`) + `testNotificationChannel(channelConfigId)` mutation (send a test message to a specific config on demand, including configured mentions)

## Verification

- Create two separate Discord `ChannelConfig`s pointing at different webhooks; `testNotificationChannel` on each posts to the correct, distinct Discord destination.
- Configure mentions (a user and a role) on a `ChannelConfig`; `testNotificationChannel` produces a real ping in Discord.
- Confirm the stored config never round-trips the raw URL through GraphQL.
