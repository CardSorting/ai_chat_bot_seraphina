const { SlashCommandBuilder } = require('@discordjs/builders');
const creditslog = require('./credit');

class CheckCreditsCommand {
  constructor(creditManager) {
    this.creditManager = creditManager;
    this.data = new SlashCommandBuilder()
      .setName('checkcredits')
      .setDescription('Check your available credits.');
  }

  async execute(interaction) {
    const userId = interaction.user.id;
    try {
      creditslog.info(`User ${userId} started the process of checking credits.`);
      const interactionStr = JSON.stringify(interaction, (_, v) => typeof v === 'bigint' ? v.toString() : v);
      creditslog.debug(`Interaction object: ${interactionStr}`);

      // Retrieve user's credits from the store
      let userCredits = await this.creditManager.creditStore.retrieveUserCredits(userId);

      // If the user has never claimed credits (lastUpdated is null),
      // or userCredits is null, undefined, or 0,
      // allow claiming 50 credits once.
      if (userCredits === null || userCredits === undefined || userCredits.lastUpdated === null) {
        userCredits = { credits: 250, lastUpdated: new Date() };
        await this.creditManager.creditStore.updateUserCredits(userId, userCredits); // Update credits in the store
        await interaction.reply(`You claimed your 250 credits! You now have ${userCredits.credits} credits.`);
      } else if (userCredits.credits === 0) {
        // User has 0 credits but has claimed before
        await interaction.reply(`You have 0 credits remaining, and the 50 credits have already been claimed.`);
      } else {
        // User has more than 0 credits
        await interaction.reply(`You have ${userCredits.credits} credits.`);
      }

      creditslog.info(`User ${userId} checked their credits. They now have ${userCredits.credits} credits.`);
    } catch (error) {
      // Log the error
      creditslog.error(`Error while user ${userId} was checking credits: ${error.message}`);
      creditslog.debug(`Error stack: ${error.stack}`);

      // Reply to the user that there was an error while executing the command
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        creditslog.error(`Replied with error for user id: ${userId}`);
      }
    }
  }
}

module.exports = CheckCreditsCommand;