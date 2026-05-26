import mineflayer from "mineflayer";
import config from "./config.js";
import { updateUserBot } from "./database.js";
import { createBotLogEmbed } from "./embeds.js";

// Store running bot instances
const botInstances = new Map();
const botIntervals = new Map();

// Create and start Minecraft bot
export async function createMinecraftBot(botData, userId, logChannel) {
  try {
    // Check if already running
    if (botInstances.has(botData.id)) {
      return { success: false, error: "Bot is already running" };
    }

    // Validate bot data
    if (!botData.username || !botData.ip) {
      return { success: false, error: "Invalid bot configuration" };
    }

    console.log(`[BOT] Starting ${botData.username} on ${botData.ip}:${botData.port}`);

    // Create bot instance
    const bot = mineflayer.createBot({
      host: botData.ip,
      port: botData.port || 25565,
      username: botData.username,
      version: botData.version || config.minecraftVersion,
      auth: botData.auth || "offline",
      hideErrors: false,
      viewDistance: "tiny"
    });

    // Set connection timeout
    let connected = false;
    const timeoutHandle = setTimeout(() => {
      if (!connected && bot) {
        bot.quit();
        botInstances.delete(botData.id);
        console.error(`[BOT] Connection timeout for ${botData.username}`);
      }
    }, config.connectTimeout);

    // Bot spawned event
    bot.once("spawn", () => {
      clearTimeout(timeoutHandle);
      connected = true;
      console.log(`[BOT] ${botData.username} spawned on ${botData.ip}`);

      // Update status
      updateUserBot(userId, botData.id, { status: "online", startTime: Date.now() });

      // Log to Discord
      if (logChannel) {
        const logEmbed = createBotLogEmbed("started", botData, userId);
        logChannel.send({ embeds: [logEmbed] }).catch(e => {
          console.error("Error sending log:", e.message);
        });
      }

      // Start anti-AFK system
      startAntiAFK(bot, botData.id);
    });

    // Handle chat
    bot.on("chat", (username, message) => {
      // Auto-respond to auth prompts
      handleAuthMessage(bot, message);
    });

    // Handle disconnect
    bot.once("end", (reason) => {
      console.log(`[BOT] ${botData.username} disconnected: ${reason}`);
      
      clearTimeout(timeoutHandle);
      botInstances.delete(botData.id);
      
      // Stop anti-AFK
      stopAntiAFK(botData.id);

      // Update status
      updateUserBot(userId, botData.id, { status: "offline" });

      // Log to Discord
      if (logChannel) {
        const logEmbed = createBotLogEmbed("disconnected", botData, userId, { reason });
        logChannel.send({ embeds: [logEmbed] }).catch(e => {
          console.error("Error sending log:", e.message);
        });
      }

      // Auto-reconnect
      handleAutoReconnect(botData, userId, logChannel);
    });

    // Handle kick
    bot.once("kicked", (reason) => {
      console.log(`[BOT] ${botData.username} kicked: ${reason}`);

      clearTimeout(timeoutHandle);
      botInstances.delete(botData.id);
      stopAntiAFK(botData.id);

      // Update status
      updateUserBot(userId, botData.id, { status: "offline" });

      // Log to Discord
      if (logChannel) {
        const logEmbed = createBotLogEmbed("kicked", botData, userId, { reason });
        logChannel.send({ embeds: [logEmbed] }).catch(e => {
          console.error("Error sending log:", e.message);
        });
      }

      // Auto-reconnect
      handleAutoReconnect(botData, userId, logChannel);
    });

    // Handle errors
    bot.on("error", (error) => {
      console.error(`[BOT] ${botData.username} error:`, error.message);

      // Log to Discord
      if (logChannel) {
        const logEmbed = createBotLogEmbed("error", botData, userId, { error });
        logChannel.send({ embeds: [logEmbed] }).catch(e => {
          console.error("Error sending log:", e.message);
        });
      }
    });

    // Store bot instance
    botInstances.set(botData.id, bot);

    return { success: true, message: "Bot started successfully" };
  } catch (error) {
    console.error(`[BOT] Error creating bot:`, error);
    return { success: false, error: error.message };
  }
}

// Stop bot
export async function stopMinecraftBot(botData, userId, logChannel) {
  try {
    const bot = botInstances.get(botData.id);

    if (!bot) {
      return { success: false, error: "Bot is not running" };
    }

    // Stop anti-AFK
    stopAntiAFK(botData.id);

    // Disconnect bot
    bot.quit();

    // Remove instance
    botInstances.delete(botData.id);

    // Update status
    updateUserBot(userId, botData.id, { status: "offline" });

    // Log to Discord
    if (logChannel) {
      const logEmbed = createBotLogEmbed("stopped", botData, userId);
      await logChannel.send({ embeds: [logEmbed] }).catch(e => {
        console.error("Error sending log:", e.message);
      });
    }

    console.log(`[BOT] ${botData.username} stopped`);
    return { success: true, message: "Bot stopped" };
  } catch (error) {
    console.error(`[BOT] Error stopping bot:`, error);
    return { success: false, error: error.message };
  }
}

// Restart bot
export async function restartMinecraftBot(botData, userId, logChannel) {
  try {
    // Stop bot
    await stopMinecraftBot(botData, userId, logChannel);

    // Wait before restart
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start bot
    const result = await createMinecraftBot(botData, userId, logChannel);

    if (result.success) {
      // Log restart
      if (logChannel) {
        const logEmbed = createBotLogEmbed("restarted", botData, userId);
        await logChannel.send({ embeds: [logEmbed] }).catch(e => {
          console.error("Error sending log:", e.message);
        });
      }
    }

    return result;
  } catch (error) {
    console.error(`[BOT] Error restarting bot:`, error);
    return { success: false, error: error.message };
  }
}

// Check if bot is running
export function isBotRunning(botId) {
  return botInstances.has(botId);
}

// Get bot instance
export function getBotInstance(botId) {
  return botInstances.get(botId);
}

// Start anti-AFK system
function startAntiAFK(bot, botId) {
  try {
    // Jump every 30 seconds to prevent AFK
    const interval = setInterval(() => {
      try {
        if (bot && !bot.ended) {
          bot.setControlState("jump", true);
          setTimeout(() => {
            if (bot && !bot.ended) {
              bot.setControlState("jump", false);
            }
          }, 100);
        }
      } catch (error) {
        console.error("[ANTI-AFK] Error:", error.message);
      }
    }, config.antiAfkJumpInterval);

    botIntervals.set(botId, interval);
  } catch (error) {
    console.error("[ANTI-AFK] Error starting:", error.message);
  }
}

// Stop anti-AFK system
function stopAntiAFK(botId) {
  try {
    const interval = botIntervals.get(botId);
    if (interval) {
      clearInterval(interval);
      botIntervals.delete(botId);
    }
  } catch (error) {
    console.error("[ANTI-AFK] Error stopping:", error.message);
  }
}

// Handle auth messages
function handleAuthMessage(bot, message) {
  try {
    const msg = message.toLowerCase();

    // Check for login prompt
    if (msg.includes("/login") || msg.includes("please login") || msg.includes("login required")) {
      // Send login command
      bot.chat("/login password");
      console.log("[AUTH] Login command sent");
    }

    // Check for register prompt
    if (msg.includes("/register") || msg.includes("please register") || msg.includes("register required")) {
      // Send register command
      bot.chat("/register password password");
      console.log("[AUTH] Register command sent");
    }
  } catch (error) {
    console.error("[AUTH] Error:", error.message);
  }
}

// Handle auto-reconnect
function handleAutoReconnect(botData, userId, logChannel) {
  try {
    const reconnectAttempt = (botData.reconnectCount || 0) + 1;

    // Check if max reconnect attempts reached
    if (reconnectAttempt > config.reconnectMaxAttempts) {
      console.log(`[RECONNECT] Max attempts reached for ${botData.username}`);
      return;
    }

    console.log(`[RECONNECT] Attempt ${reconnectAttempt} for ${botData.username}`);

    // Update reconnect count
    updateUserBot(userId, botData.id, { reconnectCount: reconnectAttempt });

    // Log reconnect attempt
    if (logChannel) {
      const logEmbed = createBotLogEmbed("reconnecting", botData, userId, { 
        reconnectCount: reconnectAttempt 
      });
      logChannel.send({ embeds: [logEmbed] }).catch(e => {
        console.error("Error sending log:", e.message);
      });
    }

    // Schedule reconnect with delay
    setTimeout(() => {
      createMinecraftBot(botData, userId, logChannel).catch(error => {
        console.error("[RECONNECT] Error:", error.message);
      });
    }, config.reconnectDelay);
  } catch (error) {
    console.error("[RECONNECT] Error:", error.message);
  }
}

// Cleanup bot
export function cleanupBot(botId) {
  try {
    // Stop bot if running
    const bot = botInstances.get(botId);
    if (bot) {
      bot.quit();
      botInstances.delete(botId);
    }

    // Stop anti-AFK
    stopAntiAFK(botId);
  } catch (error) {
    console.error("[CLEANUP] Error:", error.message);
  }
}

// Stop all bots (for shutdown)
export async function stopAllBots() {
  try {
    console.log("[SHUTDOWN] Stopping all bots...");

    for (const [botId, bot] of botInstances.entries()) {
      try {
        if (bot) {
          bot.quit();
        }
        botInstances.delete(botId);
        stopAntiAFK(botId);
      } catch (error) {
        console.error(`[SHUTDOWN] Error stopping bot ${botId}:`, error.message);
      }
    }

    console.log("[SHUTDOWN] All bots stopped");
  } catch (error) {
    console.error("[SHUTDOWN] Error:", error.message);
  }
}

export default {
  createMinecraftBot,
  stopMinecraftBot,
  restartMinecraftBot,
  isBotRunning,
  getBotInstance,
  cleanupBot,
  stopAllBots
};
