const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const userLastChannelMapCache = require('./UserLastChannelMapCache');
const CreditManager = require('./CreditManager');
const AddCreditsCommand = require('./AddCreditsCommand');
const CheckCreditsCommand = require('./CheckCreditsCommand');
const AskSlashCommand = require('./AskSlashCommand');

const creditManager = new CreditManager();

const commandMap = new Map();

async function setupCommands(client) {
    const addCreditsCommand = new AddCreditsCommand(creditManager);
    const checkCreditsCommand = new CheckCreditsCommand(creditManager);
    const askSlashCommand = new AskSlashCommand(client, process.env.OPENAI_API_KEY, userLastChannelMapCache, creditManager);

    commandMap.set(addCreditsCommand.data.name, addCreditsCommand);
    commandMap.set(checkCreditsCommand.data.name, checkCreditsCommand);
    commandMap.set(askSlashCommand.data.name, askSlashCommand);

    await registerCommands(client);
}


async function registerCommands(client) {
    const commands = Array.from(commandMap.values()).map(cmd => cmd.data || cmd.getCommandData());

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands globally.');
    } catch (error) {
        console.error(error);
    }
}

async function handleInteraction(interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const command = commandMap.get(commandName);

    if (command) {
        if (typeof command.execute === 'function') {
            await command.execute(interaction);
        } else {
            // Log the error or handle it as you see fit
            console.error(`The 'execute' method is not defined on the '${commandName}' command object.`);
            await interaction.reply({ content: 'There was an error handling this command.', ephemeral: true });
        }
    } else {
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    }
}

module.exports = { registerCommands, handleInteraction, setupCommands };