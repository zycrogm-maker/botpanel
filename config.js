export default {
  // Discord Bot Token
  token: "YOUR_DISCORD_BOT_TOKEN",

  // Bot Configuration
  clientId: "YOUR_BOT_CLIENT_ID",
  guildId: "YOUR_GUILD_ID",

  // Logging
  botLogsChannelId: "1507775799279751329",

  // Global Settings
  maxGlobalSlots: 40,
  panelUpdateInterval: 10000,
  reconnectDelay: 10000,
  reconnectMaxAttempts: 5,
  connectTimeout: 30000,

  // Minecraft Settings
  minecraftVersion: "1.21.8",
  antiAfkJumpInterval: 30000,

  // Colors
  colors: {
    primary: 0x5865f2,    // Discord Blurple
    success: 0x57f287,    // Green
    error: 0xed4245,      // Red
    warning: 0xfaa61a,    // Yellow
    info: 0x00acee        // Light Blue
  },

  // Emojis
  emojis: {
    online: "🟢",
    offline: "🔴",
    idle: "🟡",
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    success: "✅"
  },

  // Role Configuration
  roles: {
    owner: {
      id: "OWNER_ROLE_ID",
      slots: Infinity
    },

    admin: {
      id: "ADMIN_ROLE_ID",
      slots: Infinity
    },

    legend: {
      id: "LEGEND_ROLE_ID",
      slots: 10
    },

    ultimate: {
      id: "ULTIMATE_ROLE_ID",
      slots: 7
    },

    elite: {
      id: "ELITE_ROLE_ID",
      slots: 5
    },

    mvp: {
      id: "MVP_ROLE_ID",
      slots: 3
    },

    vip: {
      id: "VIP_ROLE_ID",
      slots: 2
    },

    member: {
      id: "MEMBER_ROLE_ID",
      slots: 1
    }
  }
};
