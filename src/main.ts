import { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { Intents } from "discord.js";
import dotenv from "dotenv";
import { Discord } from "./modules/Discord";

dotenv.config();

const discord = new Discord(
  { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] },
  process.env.GUILD_ID,
  [
    {
      name: "play",
      description: "Plays a YouTube video audio given link",
      options: [{ type: "STRING", name: "url", description: "The input url" }],
    },
  ]
);

discord.login(process.env.BOT_TOKEN);

discord.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "hello")
    interaction.reply({
      content: "world",
    });

  if (commandName === "play") {
    try {
      if (!interaction.guild) throw new Error("You're not in a server!");

      const channelId = discord.getRequesterVoiceChannel(interaction);
      const { id: guildId } = interaction.guild;
      const adapterCreator = interaction.guild
        .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator;

      discord.joinVoiceChannel({
        adapterCreator,
        guildId,
        channelId,
      });

      interaction.reply({
        content: "Joining you",
      });
    } catch (e) {
      console.log(e);

      interaction.reply({
        content: "Something gone wrong. Ask the administrator for logs!",
      });
    }
  }
});
