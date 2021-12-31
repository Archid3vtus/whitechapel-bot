import {
  CreateVoiceConnectionOptions,
  joinVoiceChannel,
  JoinVoiceChannelOptions,
  VoiceConnection,
} from "@discordjs/voice";
import DiscordJS, {
  ApplicationCommandDataResolvable,
  ApplicationCommandManager,
  Client,
  ClientOptions,
  Guild,
  GuildApplicationCommandManager,
  Interaction,
} from "discord.js";
import { IDiscord } from "../interfaces/Discord";
import { commandCreationResponse, event } from "../types/Discord";

export class Discord implements IDiscord {
  client: Client<boolean>;
  guild: Guild | undefined;
  commands:
    | GuildApplicationCommandManager
    | ApplicationCommandManager
    | undefined;

  constructor(
    options: ClientOptions,
    guildId?: string,
    commands: ApplicationCommandDataResolvable[] = [
      { name: "hello", description: "replies with world" },
    ]
  ) {
    this.client = new DiscordJS.Client(options);

    if (!!guildId) this.createCommandsAsGuild(commands, guildId);
    else this.createGlobalCommands(commands);
  }

  private async createCommands(
    commands: ApplicationCommandDataResolvable[]
  ): Promise<commandCreationResponse> {
    let response: commandCreationResponse = {
      created: [],
      notCreated: [],
    };

    await Promise.all(
      commands.map((command) => {
        return this.commands
          ?.create(command)
          .then((success) => {
            response.created.push(command);
          })
          .catch((fail) => {
            response.notCreated.push(command);
          });
      })
    );

    return response;
  }

  private createGlobalCommands(
    commands: DiscordJS.ApplicationCommandDataResolvable[]
  ): void {
    this.on("ready", async () => {
      this.commands = this.client.application?.commands;

      console.log(await this.createCommands(commands));
    });
  }

  private createCommandsAsGuild(
    commands: ApplicationCommandDataResolvable[],
    guildId: string
  ): void {
    this.on("ready", async () => {
      console.log("Bot is ready");

      this.guild = this.client.guilds.cache.get(guildId);

      if (!this.guild) throw { error: "Guild doesn't exist. Stopping." };

      this.commands = this.guild.commands;

      console.log(await this.createCommands(commands));
    });
  }

  login(token: string | undefined): void {
    if (token == null) throw { error: "BOT_TOKEN is not defined. Stopping." };

    this.client.login(token);
  }

  on<K extends keyof DiscordJS.ClientEvents>(
    event: K,
    callback: (...args: DiscordJS.ClientEvents[K]) => DiscordJS.Awaitable<void>
  ): void {
    this.client.on(event, callback);
  }

  getRequesterVoiceChannel(interaction: Interaction): string {
    if (!interaction.guildId) throw new Error("Guild id is null");
    if (!interaction.member) throw new Error("Requester is null");
    if (!this.guild) throw new Error("No guild to get info from");

    const guild = this.client.guilds.cache.get(interaction.guildId);
    const member = this.guild.members.cache.get(interaction.member.user.id);

    if (!member) throw new Error("Member doesn't exist");
    if (!member.voice.channel)
      throw new Error("Member is not in any voice channel");

    return member.voice.channel.id;
  }

  joinVoiceChannel(
    options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): VoiceConnection {
    return joinVoiceChannel(options);
  }
}
