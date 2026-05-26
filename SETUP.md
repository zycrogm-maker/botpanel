# Minecraft AFK Bot Panel - Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18.0.0 or higher
- Discord Bot Token
- Discord Server (Guild)
- Discord Role IDs for your paid tiers

### 2. Installation Steps

```bash
# Clone or download the project
cd minecraft-afk-bot-panel

# Install dependencies
npm install

# Edit config.js with your settings
nano config.js

# Start the bot
npm start
```

### 3. Configuration (config.js)

**Required settings:**

```javascript
token: "YOUR_DISCORD_BOT_TOKEN",
clientId: "YOUR_BOT_CLIENT_ID",
guildId: "YOUR_DISCORD_SERVER_ID",
```

**Role Configuration:**

Get your Discord role IDs:
1. Enable Developer Mode in Discord
2. Right-click on each role
3. Click "Copy User ID"
4. Add to `config.js`:

```javascript
roles: {
  owner: { id: "OWNER_ROLE_ID", slots: Infinity },
  admin: { id: "ADMIN_ROLE_ID", slots: Infinity },
  legend: { id: "LEGEND_ROLE_ID", slots: 10 },
  // ... other roles
}
```

**Log Channel:**

Get your log channel ID:
1. Right-click on Discord channel
2. Copy Channel ID
3. Add to `botLogsChannelId`

## 🎯 Discord Bot Setup

### 1. Create Discord Bot

Visit [Discord Developer Portal](https://discord.com/developers/applications)

1. Click "New Application"
2. Name it (e.g., "Minecraft AFK Bot")
3. Go to "Bot" tab
4. Click "Add Bot"
5. Copy token → paste in `config.js`

### 2. Bot Intents

In Developer Portal:
- Go to "Bot" section
- Enable "Message Content Intent"
- Enable "Server Members Intent"

### 3. Invite Bot to Server

In Developer Portal:
- Go to "OAuth2" → "URL Generator"
- Select scopes: `bot`
- Select permissions:
  - Send Messages
  - Embed Links
  - Use Slash Commands
  - Manage Roles
- Copy generated URL
- Open in browser to invite

### 4. Create Roles (Optional)

In your Discord server:
- Create roles: Owner, Admin, Legend, Ultimate, Elite, MVP, VIP, Member
- Assign to test users
- Copy role IDs

### 5. Create Log Channel

- Create channel: `#bot-logs`
- Copy channel ID
- Add to config

## 🛠️ Troubleshooting

### Bot won't start
- Check token is correct
- Verify Node.js version: `node -v`
- Check for typos in config.js
- Ensure all role IDs exist

### Commands not showing
- Ensure bot has "Use Slash Commands" permission
- Re-invite bot to server
- Wait 1 minute for cache to update

### Bots won't connect to Minecraft
- Verify server IP and port
- Check firewall allows connections
- Verify Minecraft version matches
- Check bot has internet access

### High memory usage
- Reduce maxGlobalSlots in config
- Close other applications
- Restart bot periodically

## 📋 File Explanations

| File | Purpose |
|------|---------|
| `index.js` | Main Discord bot with commands |
| `config.js` | Configuration and settings |
| `bot.js` | Mineflayer Minecraft bot management |
| `database.js` | User and bot data storage |
| `embeds.js` | Beautiful Discord embeds |
| `utils.js` | Helper functions and validators |
| `data.json` | User data file (auto-created) |
| `package.json` | Dependencies |

## 🔐 Security Best Practices

1. **Never share your bot token** - Keep it secret!
2. **Use environment variables** for production
3. **Backup data.json** regularly
4. **Set appropriate role permissions**
5. **Monitor logs for errors**

## 📊 Monitoring

Check logs for:
- Bot connection status
- Active bot count
- Memory usage
- Error messages

Watch the Discord bot-logs channel for:
- Bot events
- Connection issues
- Authentication attempts

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2

pm2 start index.js --name "minecraft-bot-panel"
pm2 save
pm2 startup
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t minecraft-bot-panel .
docker run -d --name bot minecraft-bot-panel
```

### Memory Management

For 12GB RAM system with 40 bots:
- Expected usage: ~2GB
- Keep 10GB free for system
- Monitor with: `free -h`

## 📞 Common Issues

### Issue: "Unknown interaction"
**Solution:** Ensure interaction is replied within 3 seconds

### Issue: Bots disconnect frequently
**Solution:** Increase reconnectDelay, check network stability

### Issue: Database corruption
**Solution:** Restore from backup, reset data.json

### Issue: Permission denied errors
**Solution:** Check bot role permissions in Discord

## ✅ Verification Checklist

- [ ] Bot token added to config.js
- [ ] Bot invited to server
- [ ] Role IDs configured
- [ ] Log channel created and ID added
- [ ] Message Content Intent enabled
- [ ] Server Members Intent enabled
- [ ] npm install completed
- [ ] Bot starts without errors
- [ ] /panel command works
- [ ] Bot logs show "Bot logged in as..."

## 🎉 You're Ready!

Your Minecraft AFK Bot Panel is now ready to use!

1. Run `/panel` in your Discord server
2. Click "Register Bot" to create your first bot
3. Click "Start Bot" to connect to Minecraft
4. Watch real-time updates in the panel

## 💬 Support

For issues:
1. Check the troubleshooting section above
2. Review error messages in Discord logs
3. Check console output
4. Review Discord.js and mineflayer documentation

---

**Professional Minecraft Bot Hosting Made Easy!**
