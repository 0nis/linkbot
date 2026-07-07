# LinkBot

LinkBot is a small Discord bot focused on connecting channels together and providing simple staff communication tools.

It is designed primarily for **private/community server use**, not as a large-scale public bot. Configuration is stored locally in a JSON file, which makes it simple to run but not ideal for very large deployments.

## Table of Contents

- [LinkBot](#linkbot)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Channel linking](#channel-linking)
    - [Staff DM system (modmail-like)](#staff-dm-system-modmail-like)
    - [Anonymous staff messages](#anonymous-staff-messages)
    - [Logging](#logging)
  - [Commands](#commands)
    - [`/link`](#link)
    - [`/link-config`](#link-config)
    - [`/unlink`](#unlink)
    - [`/links`](#links)
    - [`/link-dm`](#link-dm)
    - [`/dm`](#dm)
    - [`/say`](#say)
    - [`/say-config`](#say-config)
    - [`/log-config`](#log-config)
      - [`/log-config commands`](#log-config-commands)
      - [`/log-config errors`](#log-config-errors)
    - [`/ping`](#ping)
  - [Installation](#installation)
    - [Requirements](#requirements)
    - [Setup](#setup)
      - [Clone the repository](#clone-the-repository)
      - [Install dependencies](#install-dependencies)
      - [Create your environment file](#create-your-environment-file)
      - [Deploy slash commands](#deploy-slash-commands)
      - [Start the bot](#start-the-bot)
    - [Create a Discord application](#create-a-discord-application)
  - [Disclaimer](#disclaimer)

## Features

### Channel linking

LinkBot can connect two Discord channels together, allowing messages sent in one channel to be mirrored into another.

Each linked channel can have its own webhook appearance configuration:

- Original user identity
- Server name and icon
- Custom name and avatar

This allows messages to appear anonymous while still being recognizable as coming from a specific team or server.

### Staff DM system (modmail-like)

LinkBot can forward direct messages from users into a configured server channel.

Staff can then respond to users through the bot, allowing private conversations without exposing staff accounts.

This works similarly to a lightweight modmail system.

### Anonymous staff messages

The `/say` command allows staff members to send messages through temporary webhooks.

The appearance can be configured:

- As the original user
- As the server
- With a custom name and avatar

Attachments are also supported.

### Logging

LinkBot supports basic logging for:

- Command usage
- Errors

Each log type can have its own enabled state and destination channel.

---

## Commands

### `/link`

Create a connection between two channels.

**Permission:** Manage Channels

**Arguments:**

| Argument | Required | Description                          |
| -------- | -------- | ------------------------------------ |
| `source` | Yes      | The channel messages are copied from |
| `target` | Yes      | The channel messages are copied to   |

---

### `/link-config`

Configure how messages appear in a linked channel.

**Permission:** Manage Channels

**Arguments:**

| Argument  | Required | Description                         |
| --------- | -------- | ----------------------------------- |
| `id`      | Yes      | The link to configure               |
| `channel` | Yes      | Which side of the link to configure |
| `mode`    | Yes      | Message appearance mode             |
| `name`    | No       | Custom webhook name                 |
| `avatar`  | No       | Custom webhook avatar URL           |

Modes:

- `original` - Shows the original user's name and avatar
- `server` - Uses the server name and icon
- `custom` - Uses the provided name and avatar

---

### `/unlink`

Remove a channel link.

**Permission:** Manage Channels

**Arguments:**

| Argument | Required | Description        |
| -------- | -------- | ------------------ |
| `id`     | Yes      | The link to remove |

---

### `/links`

List all linked channels in the current server.

**Permission:** Manage Channels

---

### `/link-dm`

Configure the channel where user DMs should be forwarded.

**Permission:** Manage Channels

**Arguments:**

| Argument  | Required | Description                   |
| --------- | -------- | ----------------------------- |
| `channel` | Yes      | The channel to forward DMs to |

If this is not configured, incoming DMs are ignored.

---

### `/dm`

Send a DM to a user as the server staff team.

**Permission:** Manage Messages

**Arguments:**

| Argument  | Required | Description         |
| --------- | -------- | ------------------- |
| `user`    | Yes      | The user to DM      |
| `message` | Yes      | The message to send |

---

### `/say`

Send a message as the staff team through a temporary webhook.

**Permission:** Manage Messages

**Arguments:**

| Argument  | Required | Description                        |
| --------- | -------- | ---------------------------------- |
| `channel` | No       | The channel to send the message in |
| `message` | No       | The message content                |
| `file`    | No       | An optional attachment             |

A message must contain either text or an attachment.

---

### `/say-config`

Configure the appearance of `/say` messages.

**Permission:** Manage Channels

**Arguments:**

| Argument | Required | Description               |
| -------- | -------- | ------------------------- |
| `mode`   | Yes      | Message appearance mode   |
| `name`   | No       | Custom webhook name       |
| `avatar` | No       | Custom webhook avatar URL |

Modes:

- `original` - Uses the staff member's identity
- `server` - Uses the server name and icon
- `custom` - Uses custom values

---

### `/log-config`

Configure bot logging.

**Permission:** Manage Channels

**Subcommands:**

#### `/log-config commands`

Configure command usage logging.

**Arguments:**

| Argument  | Required | Description               |
| --------- | -------- | ------------------------- |
| `enabled` | Yes      | Enable or disable logging |
| `channel` | No       | Channel to send logs to   |

---

#### `/log-config errors`

Configure error logging.

**Arguments:**

| Argument  | Required | Description               |
| --------- | -------- | ------------------------- |
| `enabled` | Yes      | Enable or disable logging |
| `channel` | No       | Channel to send logs to   |

---

### `/ping`

Test command that replies with:

- Pong response
- Current latency

---

## Installation

### Requirements

- Node.js (recommended: current LTS version)
- npm (included with Node.js)
- A Discord server where you have permission to add bots and manage channels/webhooks

### Setup

#### Clone the repository

```bash
git clone https://github.com/0nis/linkbot.git
cd linkbot
```

#### Install dependencies

```bash
npm install
```

#### Create your environment file

```bash
cp .env.template .env
```

Open the newly created `.env` file and fill in the `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`. See the Discord application setup about creating a bot and obtaining these values.

#### Deploy slash commands

```bash
npm run deploy
```

#### Start the bot

**Development mode** - Runs the bot with automatic restarts when files change:

```bash
npm run dev
```

**Production mode** - Build the project first, then start the compiled bot:

```bash
npm run build
npm run start
```

### Create a Discord application

1. Go to: https://discord.com/developers/applications/
2. Create a new application.
3. Copy the **Application ID** and add it to your `.env` file.
4. Open the **Bot** tab.
5. Create a bot user.
6. Copy the bot **token** and add it to your `.env` file.
7. Enable the **Message Content Intent** under **Privileged Gateway Intents**:
8. Open the **Installation** tab.
9. Under **Guild Install**, give the bot the following permissions _(or just Administrator, if you're lazy)_:
   - Add Reactions
   - Attach Files
   - Bypass Slowmode
   - Embed Links
   - Manage Messages
   - Manage Webhooks
   - Read Message History
   - Send Messages
   - Use Slash Commands
   - View Channels
10. Copy the Discord-provided **Install Link** and add the bot to your server.

---

## Disclaimer

This project was built in less than a day during a very intense hyperfocus session. Code quality and architecture choices may reflect that.
