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
    {
      name: "stop",
      description: "Clear the queue and stops playing.",
    },
    {
      name: "skip",
      description:
        "Goes to the next song, if any. Stops if there are no songs in queue.",
    },
  ]
);

discord.login(process.env.BOT_TOKEN);

discord.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "skip") {
    try {
      await interaction.deferReply();

      if (!interaction.guild) throw new Error("You're not in a server!");

      let content = discord.skip();

      interaction.editReply({
        content,
      });
    } catch (e) {
      console.log(e);

      interaction.editReply({
        content: "Something gone wrong. Ask the administrator for logs!",
      });
    }
  }

  if (commandName === "stop") {
    try {
      await interaction.deferReply();

      if (!interaction.guild) throw new Error("You're not in a server!");

      discord.stop();

      interaction.editReply({
        content: "Stopping.",
      });
    } catch (e) {
      console.log(e);

      interaction.editReply({
        content: "Something gone wrong. Ask the administrator for logs!",
      });
    }
  }

  if (commandName === "play") {
    try {
      await interaction.deferReply();

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

function filterFromBannedWords(
  videoList: ytsr.Item[],
  bannedWords: string[],
  startsWith: string
) {
  let response = videoList.filter(({ type }) => {
    return type === "video";
  }) as ytsr.Video[];

  response = response.filter(({ title }) => {
    return title.toLowerCase().startsWith(startsWith);
  });

  response = response.filter(({ title }) => {
    let isClear = true;

    for (let word of bannedWords) {
      if (title.toLowerCase().includes(word)) {
        isClear = false;
        break;
      }
    }

    return isClear;
  });

  return response;
}

async function getRandomSongFrom(searchQuery: string): Promise<any> {
  let { items } = await ytsr(searchQuery);

  items = filterFromBannedWords(
    items,
    [
      "interview",
      "full album",
      "[",
      "]",
      "cover",
      "playthrough",
      "reaction",
      "live",
    ],
    `${searchQuery} -`
  );

  const response = items[randomIntFromInterval(0, items.length)];
  console.log(response);

  return response;
}
