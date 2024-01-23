const http = require('http');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const userLastChannelMapCache = require('./UserLastChannelMapCache'); // Singleton import
const CreditManager = require('./CreditManager'); // Import CreditManager
const CreditHandler = require('./CreditHandler'); // Import CreditHandler
const { registerCommands, handleInteraction, setupCommands } = require('./commandHandler'); // Import setupCommands

class MyDiscordBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.validateEnvironmentVariables();

    // Initialize CreditManager and pass as needed
    const creditManager = new CreditManager();
    this.creditHandler = new CreditHandler(creditManager); // Create CreditHandler instance with CreditManager

    this.on('interactionCreate', (interaction) => {
      handleInteraction(interaction); // Pass interaction to the command handler
    });

    // Register ask and credit commands when the bot is ready
    this.on('ready', () => {
      console.log(`Logged in as ${this.user.tag}!`);
      setupCommands(this); // Setup commands after the client is ready
    });
  }

  startHttpServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    });

    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`HTTP Server running on http://localhost:${PORT}/`);
    });
  }

  validateEnvironmentVariables() {
    const requiredEnvVars = ['DISCORD_BOT_TOKEN', 'OPENAI_API_KEY'];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        process.exit(1);
      }
    });
  }

  async start() {
    this.startHttpServer(); // Start HTTP server
    await this.login(process.env.DISCORD_BOT_TOKEN);
  }
}

const bot = new MyDiscordBot();
bot.start();