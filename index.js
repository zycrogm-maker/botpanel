import {
  Client,
  GatewayIntentBits,
  Collection,
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config.js";
import {
  loadData,
  saveData,
  getUserData,
  saveUserData,
  getUserBots,
  getBotById,
  addUserBot,
  deleteUserBot,
  updateUserBot,
  countActiveBots,
  generateBotId,
  usernameExists,
  getBotByUsername
} from "./database.js";
import {
  getUserSlotLimit,
  isAdmin,
  getUserBotCount,
  canUserStartBot,
  getUserAvailableSlots,
  validateMinecraftUsername,
  validateServerIP,
  validatePort
} from "./utils.js";
import {
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
  createBotStatusEmbed,
  createPanelEmbed,
  createBotLogEmbed
} from "./embeds.js";
import {
  createMinecraftBot,
  stopMinecraftBot,
  restartMinecraftBot,
  cleanupBot,
  isBotRunning,
  stopAllBots
} from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Store for panel message IDs
const panelMessages = new Map();
let panelUpdateInterval;

// Client ready
client.once("ready", () => {
  console.log(`\n✅ Bot logged in as ${client.user.tag}`);
  console.log(`📊 Connected to ${client.guilds.cache.size} guild(s)\n`);

  // Update bot status
  client.user.setActivity("Minecraft AFK Bots", { type: "WATCHING" });

  // Start panel updates
  startPanelUpdates();

  // Register slash commands
  registerSlashCommands();
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
      handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      handleSelectMenuInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error("Interaction error:", error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          embeds: [createErrorEmbed("Error", "An error occurred processing your request")],
          ephemeral: true
        });
      } catch (e) {
        console.error("Error sending error response:", e);
      }
    }
  }
});

// Handle slash commands
async function handleSlashCommand(interaction) {
  try {
    const { commandName } = interaction;

    // Defer reply
    await interaction.deferReply({ ephemeral: commandName !== "panel" });

    if (commandName === "panel") {
      await showPanel(interaction);
    } else if (commandName === "status") {
      await showStatus(interaction);
    } else if (commandName === "help") {
      await showHelp(interaction);
    } else if (commandName === "mybot") {
      await showMyBots(interaction);
    } else if (commandName === "admin") {
      await showAdminPanel(interaction);
    }
  } catch (error) {
    console.error("Slash command error:", error);
    if (!interaction.replied) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Error", error.message)]
      }).catch(() => {});
    }
  }
}

// Show main panel
async function showPanel(interaction) {
  try {
    const member = interaction.member;
    const activeBots = countActiveBots();
    const maxSlots = config.maxGlobalSlots;
    const userSlotLimit = getUserSlotLimit(member);
    const userBotCount = getUserBotCount(member.id);

    const embed = createPanelEmbed(activeBots, maxSlots, maxSlots, userSlotLimit, userBotCount);

    // Create buttons
    const registerBtn = new ButtonBuilder()
      .setCustomId("btn_register")
      .setLabel("📝 Register Bot")
      .setStyle(ButtonStyle.Primary);

    const startBtn = new ButtonBuilder()
      .setCustomId("btn_start")
      .setLabel("▶️ Start Bot")
      .setStyle(ButtonStyle.Success);

    const stopBtn = new ButtonBuilder()
      .setCustomId("btn_stop")
      .setLabel("⏹️ Stop Bot")
      .setStyle(ButtonStyle.Danger);

    const restartBtn = new ButtonBuilder()
      .setCustomId("btn_restart")
      .setLabel("🔄 Restart Bot")
      .setStyle(ButtonStyle.Secondary);

    const statusBtn = new ButtonBuilder()
      .setCustomId("btn_status")
      .setLabel("📊 Status")
      .setStyle(ButtonStyle.Secondary);

    const deleteBtn = new ButtonBuilder()
      .setCustomId("btn_delete")
      .setLabel("🗑️ Delete Bot")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(registerBtn, startBtn, stopBtn, restartBtn);
    const row2 = new ActionRowBuilder().addComponents(statusBtn, deleteBtn);

    const message = await interaction.editReply({
      embeds: [embed],
      components: [row1, row2],
      fetchReply: true
    });

    // Store message ID for updates
    panelMessages.set(interaction.user.id, {
      messageId: message.id,
      channelId: message.channelId,
      userId: interaction.user.id
    });
  } catch (error) {
    console.error("Error showing panel:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", "Failed to show panel")]
    }).catch(() => {});
  }
}

// Handle button interactions
async function handleButtonInteraction(interaction) {
  const { customId, user, member } = interaction;
  const logChannel = await getLogChannel();

  try {
    if (customId === "btn_register") {
      await showRegisterModal(interaction);
    } else if (customId === "btn_start") {
      await showSelectBotModal(interaction, "start");
    } else if (customId === "btn_stop") {
      await showSelectBotModal(interaction, "stop");
    } else if (customId === "btn_restart") {
      await showSelectBotModal(interaction, "restart");
    } else if (customId === "btn_status") {
      await showBotStatusMenu(interaction);
    } else if (customId === "btn_delete") {
      await showSelectBotModal(interaction, "delete");
    } else if (customId.startsWith("action_")) {
      const [, action, botId] = customId.split("_");

      // Check if user owns bot or is admin
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (!bot && !isAdmin(member)) {
        await interaction.reply({
          embeds: [createErrorEmbed("Access Denied", "You don't own this bot")],
          ephemeral: true
        });
        return;
      }

      if (action === "start") {
        await startBot(interaction, bot);
      } else if (action === "stop") {
        await stopBot(interaction, bot);
      } else if (action === "restart") {
        await restartBot(interaction, bot);
      } else if (action === "delete") {
        await confirmDelete(interaction, bot);
      }
    }
  } catch (error) {
    console.error("Button interaction error:", error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          embeds: [createErrorEmbed("Error", "An error occurred")],
          ephemeral: true
        });
      } catch (e) {
        console.error("Error sending error response:", e);
      }
    }
  }
}

// Handle select menu interactions
async function handleSelectMenuInteraction(interaction) {
  const { customId, values, user, member } = interaction;

  try {
    await interaction.deferReply({ ephemeral: true });

    if (customId === "select_bot_start") {
      const botId = values[0];
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (bot) {
        await startBot(interaction, bot);
      }
    } else if (customId === "select_bot_stop") {
      const botId = values[0];
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (bot) {
        await stopBot(interaction, bot);
      }
    } else if (customId === "select_bot_restart") {
      const botId = values[0];
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (bot) {
        await restartBot(interaction, bot);
      }
    } else if (customId === "select_bot_delete") {
      const botId = values[0];
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (bot) {
        await confirmDelete(interaction, bot);
      }
    } else if (customId === "select_bot_status") {
      const botId = values[0];
      const bots = getUserBots(user.id);
      const bot = bots.find(b => b.id === botId);

      if (bot) {
        const embed = createBotStatusEmbed(bot, user.id);
        await interaction.editReply({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error("Select menu error:", error);
    if (!interaction.replied) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Error", "An error occurred")]
      }).catch(() => {});
    }
  }
}

// Handle modal submissions
async function handleModalSubmit(interaction) {
  const { customId, fields, user, member } = interaction;

  try {
    await interaction.deferReply({ ephemeral: true });

    if (customId === "modal_register") {
      const username = fields.getTextInputValue("register_username").trim();
      const ip = fields.getTextInputValue("register_ip").trim();
      const port = fields.getTextInputValue("register_port")?.trim() || "25565";
      const password = fields.getTextInputValue("register_password")?.trim() || "";
      const version = fields.getTextInputValue("register_version")?.trim() || config.minecraftVersion;

      // Validate
      if (!validateMinecraftUsername(username)) {
        await interaction.editReply({
          embeds: [createErrorEmbed(
            "Invalid Username",
            "Username must be 3-16 characters, alphanumeric and underscore only"
          )]
        });
        return;
      }

      if (!validateServerIP(ip)) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Invalid Server IP", "Please enter a valid IP or hostname")]
        });
        return;
      }

      if (!validatePort(port)) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Invalid Port", "Port must be between 1 and 65535")]
        });
        return;
      }

      // Check slot limit
      if (!canUserStartBot(member)) {
        await interaction.editReply({
          embeds: [createErrorEmbed(
            "Slot Limit Reached",
            `You can only have ${getUserSlotLimit(member)} bot(s). ${getUserAvailableSlots(member)} slots available.`
          )]
        });
        return;
      }

      // Check if username already in use
      if (usernameExists(username)) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Username Taken", "This username is already being used by another bot")]
        });
        return;
      }

      // Create bot
      const botData = {
        id: generateBotId(),
        username,
        ip,
        port: parseInt(port),
        password,
        version,
        auth: "offline",
        status: "offline",
        reconnectCount: 0,
        uptime: 0,
        startTime: null
      };

      addUserBot(user.id, botData);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          "Bot Registered",
          `Bot **${username}** has been registered successfully!\n\nYou can now start it using the panel buttons.`
        )]
      });
    }
  } catch (error) {
    console.error("Modal submit error:", error);
    if (!interaction.replied) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Error", error.message)]
      }).catch(() => {});
    }
  }
}

// Start bot
async function startBot(interaction, bot) {
  const logChannel = await getLogChannel();

  try {
    if (isBotRunning(bot.id)) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Already Running", "This bot is already running")]
      });
      return;
    }

    const activeBots = countActiveBots();
    if (activeBots >= config.maxGlobalSlots) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Global Slots Full", "All global slots are currently in use")]
      });
      return;
    }

    // Start bot
    const result = await createMinecraftBot(bot, interaction.user.id, logChannel);

    if (result.success) {
      await interaction.editReply({
        embeds: [createSuccessEmbed(
          "Bot Starting",
          `Bot **${bot.username}** is starting on ${bot.ip}:${bot.port}`
        )]
      });
    } else {
      await interaction.editReply({
        embeds: [createErrorEmbed("Failed to Start", result.error)]
      });
    }
  } catch (error) {
    console.error("Start bot error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Stop bot
async function stopBot(interaction, bot) {
  const logChannel = await getLogChannel();

  try {
    const result = await stopMinecraftBot(bot, interaction.user.id, logChannel);

    if (result.success) {
      await interaction.editReply({
        embeds: [createSuccessEmbed("Bot Stopped", `Bot **${bot.username}** has been stopped`)]
      });
    } else {
      await interaction.editReply({
        embeds: [createErrorEmbed("Failed to Stop", result.error)]
      });
    }
  } catch (error) {
    console.error("Stop bot error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Restart bot
async function restartBot(interaction, bot) {
  const logChannel = await getLogChannel();

  try {
    const result = await restartMinecraftBot(bot, interaction.user.id, logChannel);

    if (result.success) {
      await interaction.editReply({
        embeds: [createSuccessEmbed("Bot Restarting", `Bot **${bot.username}** is restarting...`)]
      });
    } else {
      await interaction.editReply({
        embeds: [createErrorEmbed("Failed to Restart", result.error)]
      });
    }
  } catch (error) {
    console.error("Restart bot error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Delete bot
async function deleteBot(interaction, bot) {
  try {
    // Stop if running
    if (isBotRunning(bot.id)) {
      await stopMinecraftBot(bot, interaction.user.id, null);
    }

    // Delete from database
    deleteUserBot(interaction.user.id, bot.id);

    // Cleanup
    cleanupBot(bot.id);

    await interaction.editReply({
      embeds: [createSuccessEmbed("Bot Deleted", `Bot **${bot.username}** has been deleted`)]
    });
  } catch (error) {
    console.error("Delete bot error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Confirm delete
async function confirmDelete(interaction, bot) {
  try {
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`action_delete_${bot.id}`)
      .setLabel("✅ Confirm Delete")
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId("btn_cancel")
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    await interaction.editReply({
      embeds: [createWarningEmbed(
        "Confirm Deletion",
        `Are you sure you want to delete bot **${bot.username}**? This action cannot be undone.`
      )],
      components: [row]
    });

    // Handle button clicks
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 30000
    });

    collector.on("collect", async (i) => {
      try {
        if (i.customId === `action_delete_${bot.id}`) {
          await deleteBot(i, bot);
          collector.stop();
        } else if (i.customId === "btn_cancel") {
          await i.deferUpdate();
          collector.stop();
        }
      } catch (error) {
        console.error("Confirm delete error:", error);
      }
    });
  } catch (error) {
    console.error("Confirm delete setup error:", error);
  }
}

// Show register modal
async function showRegisterModal(interaction) {
  try {
    // Check slot limit first
    if (!canUserStartBot(interaction.member)) {
      await interaction.reply({
        embeds: [createErrorEmbed(
          "Slot Limit Reached",
          `You can create up to ${getUserSlotLimit(interaction.member)} bot(s)`
        )],
        ephemeral: true
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("modal_register")
      .setTitle("Register New Minecraft Bot");

    const usernameInput = new TextInputBuilder()
      .setCustomId("register_username")
      .setLabel("Minecraft Username")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("3-16 characters")
      .setRequired(true)
      .setMaxLength(16)
      .setMinLength(3);

    const ipInput = new TextInputBuilder()
      .setCustomId("register_ip")
      .setLabel("Server IP")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("example.com or 127.0.0.1")
      .setRequired(true);

    const portInput = new TextInputBuilder()
      .setCustomId("register_port")
      .setLabel("Server Port")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("25565")
      .setRequired(false)
      .setValue("25565");

    const passwordInput = new TextInputBuilder()
      .setCustomId("register_password")
      .setLabel("Bot Password (Optional)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Leave empty for no auth")
      .setRequired(false);

    const versionInput = new TextInputBuilder()
      .setCustomId("register_version")
      .setLabel("Minecraft Version")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("1.21.8")
      .setRequired(false)
      .setValue(config.minecraftVersion);

    const row1 = new ActionRowBuilder().addComponents(usernameInput);
    const row2 = new ActionRowBuilder().addComponents(ipInput);
    const row3 = new ActionRowBuilder().addComponents(portInput);
    const row4 = new ActionRowBuilder().addComponents(passwordInput);
    const row5 = new ActionRowBuilder().addComponents(versionInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Register modal error:", error);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [createErrorEmbed("Error", "Failed to show registration form")],
        ephemeral: true
      }).catch(() => {});
    }
  }
}

// Show select bot menu
async function showSelectBotModal(interaction, action) {
  try {
    const bots = getUserBots(interaction.user.id);

    if (bots.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed("No Bots", "You don't have any registered bots yet")],
        ephemeral: true
      });
      return;
    }

    const options = bots.map(bot => ({
      label: `${bot.username} (${bot.status})`,
      value: bot.id,
      description: `${bot.ip}:${bot.port}`
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`select_bot_${action}`)
      .setPlaceholder(`Select a bot to ${action}`)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: `Select a bot to ${action}:`,
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error("Select bot error:", error);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [createErrorEmbed("Error", "Failed to show bot selection")],
        ephemeral: true
      }).catch(() => {});
    }
  }
}

// Show bot status menu
async function showBotStatusMenu(interaction) {
  try {
    const bots = getUserBots(interaction.user.id);

    if (bots.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed("No Bots", "You don't have any registered bots yet")]
      });
      return;
    }

    const options = bots.map(bot => ({
      label: `${bot.username} (${bot.status})`,
      value: bot.id,
      description: `${bot.ip}:${bot.port}`
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_bot_status")
      .setPlaceholder("Select a bot to view status")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({
      content: "Select a bot to view its status:",
      components: [row]
    });
  } catch (error) {
    console.error("Status menu error:", error);
    if (!interaction.replied) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Error", "Failed to show status menu")]
      }).catch(() => {});
    }
  }
}

// Show my bots
async function showMyBots(interaction) {
  try {
    const bots = getUserBots(interaction.user.id);

    if (bots.length === 0) {
      await interaction.editReply({
        embeds: [createInfoEmbed("My Bots", "You don't have any registered bots yet")]
      });
      return;
    }

    const embeds = [];
    for (const bot of bots) {
      const embed = createBotStatusEmbed(bot, interaction.user.id);
      embeds.push(embed);
    }

    await interaction.editReply({ embeds });
  } catch (error) {
    console.error("My bots error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Show status
async function showStatus(interaction) {
  try {
    const activeBots = countActiveBots();
    const globalSlots = config.maxGlobalSlots;
    const availableSlots = globalSlots - activeBots;

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle("🔍 System Status")
      .addFields(
        { name: config.emojis.online + " Active Bots", value: activeBots.toString(), inline: true },
        { name: config.emojis.info + " Available Slots", value: availableSlots.toString(), inline: true },
        { name: "📊 Max Slots", value: globalSlots.toString(), inline: true },
        { name: "⚙️ Backend Status", value: config.emojis.online + " Online", inline: true },
        { name: "🔄 Auto Reconnect", value: "✅ Enabled", inline: true },
        { name: "📝 Logging", value: "✅ Enabled", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Minecraft AFK Bot Panel" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Status error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Show help
async function showHelp(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle("❓ Help & Commands")
      .setDescription("Minecraft AFK Bot Control Panel")
      .addFields(
        {
          name: "/panel",
          value: "Show the main control panel",
          inline: false
        },
        {
          name: "/status",
          value: "View system status and bot count",
          inline: false
        },
        {
          name: "/mybot",
          value: "List all your registered bots",
          inline: false
        },
        {
          name: "/help",
          value: "Show this help message",
          inline: false
        }
      )
      .addFields(
        {
          name: "Panel Buttons",
          value: "📝 **Register** - Register a new bot\n▶️ **Start** - Start your bot\n⏹️ **Stop** - Stop your bot\n🔄 **Restart** - Restart your bot\n📊 **Status** - View bot status\n🗑️ **Delete** - Delete your bot",
          inline: false
        },
        {
          name: "Your Slot Limit",
          value: `${getUserSlotLimit(interaction.member)} bot(s)`,
          inline: true
        },
        {
          name: "Your Current Bots",
          value: `${getUserBotCount(interaction.user.id)}/${getUserSlotLimit(interaction.member)}`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: "Minecraft AFK Bot Panel - Professional Hosting" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Help error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Show admin panel
async function showAdminPanel(interaction) {
  try {
    if (!isAdmin(interaction.member)) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Access Denied", "Only admins can use this command")]
      });
      return;
    }

    const activeBots = countActiveBots();
    const allBots = getAllActiveBots();

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("⚙️ Admin Panel")
      .setDescription("Admin controls and system information")
      .addFields(
        { name: config.emojis.online + " Active Bots", value: activeBots.toString(), inline: true },
        { name: "📊 Max Global Slots", value: config.maxGlobalSlots.toString(), inline: true },
        { name: "🆔 Discord Guild", value: config.guildId, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Minecraft AFK Bot Panel" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Admin panel error:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed("Error", error.message)]
    }).catch(() => {});
  }
}

// Get log channel
async function getLogChannel() {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return null;
    return guild.channels.cache.get(config.botLogsChannelId);
  } catch (error) {
    console.error("Error getting log channel:", error);
    return null;
  }
}

// Get all active bots
function getAllActiveBots() {
  const data = loadData();
  const activeBots = [];
  for (const userId in data.users) {
    const bots = data.users[userId].bots || [];
    activeBots.push(...bots.filter(bot => bot.status === "online"));
  }
  return activeBots;
}

// Start panel updates
function startPanelUpdates() {
  if (panelUpdateInterval) clearInterval(panelUpdateInterval);

  panelUpdateInterval = setInterval(async () => {
    try {
      for (const [userId, panelInfo] of panelMessages.entries()) {
        try {
          const guild = client.guilds.cache.get(config.guildId);
          if (!guild) continue;

          const channel = guild.channels.cache.get(panelInfo.channelId);
          if (!channel) continue;

          const message = await channel.messages.fetch(panelInfo.messageId).catch(() => null);
          if (!message) continue;

          const member = guild.members.cache.get(userId);
          if (!member) continue;

          const activeBots = countActiveBots();
          const maxSlots = config.maxGlobalSlots;
          const userSlotLimit = getUserSlotLimit(member);
          const userBotCount = getUserBotCount(userId);

          const embed = createPanelEmbed(activeBots, maxSlots, maxSlots, userSlotLimit, userBotCount);

          await message.edit({ embeds: [embed] }).catch(() => {});
        } catch (error) {
          console.error("Panel update error:", error.message);
        }
      }
    } catch (error) {
      console.error("Panel update interval error:", error);
    }
  }, config.panelUpdateInterval);
}

// Register slash commands
async function registerSlashCommands() {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.error("Guild not found");
      return;
    }

    const commands = [
      new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Show the Minecraft Bot Control Panel"),
      new SlashCommandBuilder()
        .setName("status")
        .setDescription("View system status"),
      new SlashCommandBuilder()
        .setName("mybot")
        .setDescription("View your registered bots"),
      new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show help information"),
      new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin panel (Admin only)")
    ];

    await guild.commands.set(commands);
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Login
client.login(config.token).catch(error => {
  console.error("❌ Login error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await stopAllBots();
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down...");
  await stopAllBots();
  client.destroy();
  process.exit(0);
});

export default client;
