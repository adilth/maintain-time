# Bot Commands Autocomplete

## Overview

The Telegram bot supports command autocomplete, showing a menu of available commands when you type `/` in the chat.

## How It Works

The bot automatically registers commands with Telegram when it starts. These commands appear in a popup menu when you type `/` in the Telegram chat.

## Registered Commands

1. **/start** - Start the bot
2. **/help** - Show all commands
3. **/recommend** - Get video recommendations
4. **/mood** - Set your mood
5. **/profile** - Manage your profile
6. **/history** - View recommendation history
7. **/saves** - View saved content
8. **/trending** - Get trending videos
9. **/stats** - View your statistics
10. **/mysaves** - View personal saved videos
11. **/myhistory** - View personal history
12. **/notifications** - Manage notifications
13. **/skip** - Skip current action
14. **/reset** - Reset your profile

## Manual Command Registration

If the autocomplete menu doesn't appear, you can manually register commands:

```bash
pnpm run bot:commands
```

This script will:
1. Clear any old commands
2. Register all bot commands
3. Verify they were set correctly

## Troubleshooting

### Commands Don't Appear

If you type `/` and don't see the command menu:

1. **Close and reopen the chat** with your bot
2. **Wait a few seconds** for Telegram to sync
3. **Try typing `/` again**
4. **Restart the bot**: `pnpm run dev:all`
5. **Manually set commands**: `pnpm run bot:commands`

### Verification

Check if commands are registered:

```bash
pnpm run bot:commands
```

You should see output like:
```
✅ Found 14 commands:
   1. /start - Start the bot
   2. /help - Show all commands
   ...
```

### Clear Cache

Sometimes Telegram caches old commands. To fix:

1. Stop the bot
2. Run: `pnpm run bot:commands`
3. Close and reopen the Telegram app
4. Open the bot chat again

## Technical Details

Commands are registered using the Telegram Bot API:
- **Method**: `setMyCommands`
- **Timing**: After bot launches
- **Scope**: Default (all chats)
- **Persistence**: Stored by Telegram

## Adding New Commands

To add a new command:

1. Add handler in `src/bot/handlers.ts`:
```typescript
export async function handleNewCommand(ctx: BotContext) {
  // Implementation
}
```

2. Register in `src/bot/index.ts`:
```typescript
bot.command("newcmd", handleNewCommand);
```

3. Add to commands list in `src/bot/start.ts` and `src/bot/set-commands.ts`:
```typescript
{ command: "newcmd", description: "Description here" }
```

4. Run `pnpm run bot:commands` to update Telegram
