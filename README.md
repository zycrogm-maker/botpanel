# Minecraft AFK Bot Hosting Panel

**Professional Discord-based Minecraft AFK Bot Control Panel** built with Node.js, discord.js v14, and mineflayer.

## 🎮 Features

### Core Features
- ✅ **40 Global Slot System** - Configurable maximum running bots
- ✅ **Role-Based Slot Limits** - Owner (∞), Admin (∞), Legend (10), Ultimate (7), Elite (5), MVP (3), VIP (2), Member (1)
- ✅ **Multi-Bot Support** - Users can create multiple bots based on their role
- ✅ **Auto-Reconnect System** - Smart reconnection with cooldowns and limits
- ✅ **Professional Panel Embed** - Real-time updating with live statistics

### Bot Management
- ✅ **Register Bots** - Modal form with validation
- ✅ **Start/Stop/Restart** - Full bot lifecycle management
- ✅ **Delete Bots** - Confirmation system with safe cleanup
- ✅ **Status Display** - Real-time bot information
- ✅ **Username Protection** - No modification, exact preservation
- ✅ **Duplicate Prevention** - Prevents duplicate usernames and running instances

### Advanced Features
- ✅ **Anti-AFK System** - Jump every 30 seconds
- ✅ **Smart Auth Detection** - Auto-login and register handling
- ✅ **Uptime Tracking** - Monitor each bot's uptime
- ✅ **Reconnect Counting** - Track reconnection attempts
- ✅ **Logging System** - Professional embeds to log channel
- ✅ **Security System** - Owner/admin bypass with permission checks

### Stability & Error Handling
- ✅ **Connection Timeout Protection** - 30-second timeout
- ✅ **Memory Optimization** - Proper interval and listener cleanup
- ✅ **Long-Distance Server Support** - Optimized for latency
- ✅ **Process Protection** - Handles uncaught exceptions
- ✅ **Graceful Shutdown** - Safe bot disconnect on exit
- ✅ **High Latency Support** - Aternos and overseas servers

### UI/UX
- ✅ **Slash Commands** - `/panel`, `/status`, `/mybot`, `/help`, `/admin`
- ✅ **Interactive Buttons** - Register, Start, Stop, Restart, Status, Delete
- ✅ **Select Menus** - Easy bot selection
- ✅ **Modal Forms** - Professional registration interface
- ✅ **Real-time Embeds** - Auto-updating panel

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **Discord Bot Token** with intents enabled
- **12GB RAM** (optimized)
- Minecraft servers to connect to

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/minecraft-afk-bot-panel.git
cd minecraft-afk-bot-panel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure the bot

Edit `config.js` and set up:
```javascript
token: "YOUR_BOT_TOKEN",
clientId: "YOUR_CLIENT_ID",
guildId: "YOUR_GUILD_ID",
```

Set your Discord role IDs:
```javascript
roles: {
  owner: { id: "ROLE_ID", slots: Infinity },
  admin: { id: "ROLE_ID", slots: Infinity },
  legend: { id: "ROLE_ID", slots: 10 },
  // ... other roles
}
```

### 4. Run the bot
```bash
npm start
```

Or for development with hot reload:
```bash
npm run dev
```

## 📁 Project Structure

```
.
├── index.js          # Main Discord bot with commands
├── config.js         # Configuration and settings
├── bot.js            # Minecraft bot management (mineflayer)
├── database.js       # Database operations
├── embeds.js         # Professional embed builders
├── utils.js          # Utility functions
├── data.json         # User data storage
└── package.json      # Dependencies
```

## 🎯 Slash Commands

| Command | Description |
|---------|-------------|
| `/panel` | Show the main control panel |
| `/status` | View system status and bot count |
| `/mybot` | List all your registered bots |
| `/help` | Show help information |
| `/admin` | Admin panel (Admin only) |

## 🖱️ Panel Buttons

| Button | Action |
|--------|--------|
| 📝 Register | Register a new bot |
| ▶️ Start | Start your bot |
| ⏹️ Stop | Stop your bot |
| 🔄 Restart | Restart your bot |
| 📊 Status | View bot status |
| 🗑️ Delete | Delete your bot |

## 🔐 Security Features

- **Role-based access control** - Different users have different slot limits
- **Owner verification** - Users can only control their own bots
- **Admin bypass** - Admins can control any bot
- **Input validation** - All inputs are validated before processing
- **Duplicate prevention** - Prevents duplicate bots and running instances
- **Permission checks** - Secure interaction handling

## 📊 Bot Slot System

### Role Hierarchy (by slots)
1. **Owner** - Unlimited bots
2. **Admin** - Unlimited bots
3. **Legend** - 10 bots
4. **Ultimate** - 7 bots
5. **Elite** - 5 bots
6. **MVP** - 3 bots
7. **VIP** - 2 bots
8. **Member** - 1 bot

### Global Slots
- Maximum 40 running bots across all users
- System prevents exceeding global limit
- Real-time slot tracking

## 🌐 Minecraft Bot Features

### Connection Settings
- Supports any Minecraft server (IP/hostname)
- Custom ports (default 25565)
- Configurable Minecraft versions
- Offline and Microsoft auth modes

### Auto-Reconnect
- Automatic reconnection on disconnect
- Configurable reconnect delay
- Anti-spam protection
- Max reconnect attempts limit

### Anti-AFK System
- Automatic jump every 30 seconds
- Lightweight movement (no packet spam)
- Keeps bot connected indefinitely

### Authentication
- Auto-detection of auth servers
- Automatic `/login` and `/register` commands
- Optional password support
- Smart auth message detection

## 📝 Database Structure

```json
{
  "users": {
    "DISCORD_USER_ID": {
      "bots": [
        {
          "id": "unique_bot_id",
          "username": "ExactUsername",
          "ip": "server.ip",
          "port": 25565,
          "version": "1.21.8",
          "auth": "offline",
          "password": "optional_password",
          "status": "online",
          "reconnectCount": 0,
          "startTime": 1234567890000
        }
      ]
    }
  }
}
```

## ⚙️ Configuration

### Global Settings
```javascript
maxGlobalSlots: 40,              // Maximum concurrent bots
panelUpdateInterval: 10000,      // Panel update frequency (ms)
reconnectDelay: 10000,           // Delay between reconnects (ms)
reconnectMaxAttempts: 5,         // Max reconnection attempts
connectTimeout: 30000            // Connection timeout (ms)
```

### Minecraft Settings
```javascript
minecraftVersion: "1.21.8",      // Default MC version
antiAfkJumpInterval: 30000       // Anti-AFK jump frequency (ms)
```

## 📊 Logging System

All bot events are logged to a Discord channel with professional embeds:

- 🟢 **Connected** - Bot connected to server
- 🟡 **Reconnecting** - Bot attempting to reconnect
- 🔴 **Disconnected** - Bot disconnected from server
- ⏹️ **Stopped** - Bot stopped by user
- ▶️ **Started** - Bot started
- 🔄 **Restarted** - Bot restarted
- ❌ **Error** - Bot encountered an error
- 🚫 **Kicked** - Bot was kicked from server
- 🗑️ **Deleted** - Bot was deleted

## 🔧 Troubleshooting

### Bot won't connect
- Verify server IP and port are correct
- Check Minecraft version matches server
- Ensure bot has internet access
- Check firewall rules

### High memory usage
- The system is optimized for 12GB RAM
- Each bot instance uses ~50MB RAM
- With 40 bots: ~2GB total
- Proper cleanup on disconnect

### Bots not reconnecting
- Check `reconnectMaxAttempts` setting
- Verify `reconnectDelay` is not too high
- Check Discord logs for error messages
- Ensure bot has proper permissions

## 📈 Performance Optimization

- **Memory efficient** - Proper cleanup of unused instances
- **Connection pooling** - Reuses bot instances
- **Timeout protection** - Prevents hanging connections
- **Batch operations** - Efficient database writes
- **RAM optimized** - 12GB system support
- **Low CPU usage** - Lightweight AFK operations

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [discord.js](https://discord.js.org/) - Discord API wrapper
- [mineflayer](https://github.com/PrismarineJS/mineflayer) - Minecraft bot library

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Discord.js documentation
3. Check mineflayer docs
4. Create an issue on GitHub

---

**Made with ❤️ for Minecraft hosting communities**
