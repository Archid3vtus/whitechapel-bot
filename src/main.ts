import { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { Intents } from "discord.js";
import dotenv from "dotenv";
import { Discord } from "./modules/Discord";
import ytsr from "ytsr";

dotenv.config();

const discord = new Discord(
  {
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGES,
    ],
  },
  process.env.GUILD_ID,
  [
    {
      name: "play",
      description: "Plays a random Whitechapel song.",
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

      await interaction.deferReply();

      const channelId = discord.getRequesterVoiceChannel(interaction);
      const { id: guildId } = interaction.guild;
      const adapterCreator = interaction.guild
        .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator;

      discord.joinVoiceChannel({
        adapterCreator,
        guildId,
        channelId,
      });

      const { url } = await getRandomSongFrom("whitechapel");
      if (url != null) {
        discord.addToQueue(url);
      }

      interaction.editReply({
        content: `Queued ${url}`,
      });
    } catch (e) {
      console.log(e);

      interaction.editReply({
        content: "Something gone wrong. Ask the administrator for logs!",
      });
    }
  }
});

const randomIntFromInterval = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

async function getRandomSongFrom(searchQuery: string): Promise<any> {
  let { items } = await ytsr(searchQuery);

  items = items.filter((item) => {
    return item.type === "video";
  });

  return items[randomIntFromInterval(0, items.length)];
}
