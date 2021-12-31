import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  CreateVoiceConnectionOptions,
  demuxProbe,
  joinVoiceChannel,
  JoinVoiceChannelOptions,
  StreamType,
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
import ytdl from "ytdl-core";
import { IDiscord } from "../interfaces/Discord";
import { commandCreationResponse, event } from "../types/Discord";

export class Discord implements IDiscord {
  client: Client<boolean>;
  guild: Guild | undefined;
  commands:
    | GuildApplicationCommandManager
    | ApplicationCommandManager
    | undefined;
  player: AudioPlayer;
  queue: string[];

  constructor(
    options: ClientOptions,
    guildId?: string,
    commands: ApplicationCommandDataResolvable[] = [
      { name: "hello", description: "replies with world" },
    ]
  ) {
    this.client = new DiscordJS.Client(options);
    this.player = createAudioPlayer();
    this.queue = [];
    this.definePlayer();

    this.client.on("ready", async () => {
      if (!!guildId) this.createCommandsAsGuild(commands, guildId);
      else this.createGlobalCommands(commands);
    });
  }

  private definePlayer() {
    this.player.on("error", (error) => {
      console.log(error);
    });

    this.player.on(AudioPlayerStatus.Idle, async () => {
      this.playFromQueue();
    });
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
    this.commands = this.client.application?.commands;

    this.createCommands(commands).then((data) => {
      console.log(JSON.stringify(data, null, 2));
    });
  }

  private createCommandsAsGuild(
    commands: ApplicationCommandDataResolvable[],
    guildId: string
  ): void {
    console.log("Bot is ready");

    this.guild = this.client.guilds.cache.get(guildId);

    if (!this.guild) throw { error: "Guild doesn't exist. Stopping." };

    this.commands = this.guild.commands;

    this.createCommands(commands).then((data) => {
      console.log(data);
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
  ): void {
    const connection = joinVoiceChannel(options);
    connection.subscribe(this.player);
  }

  private async probeAndCreateResource(readableStream: any) {
    const { stream, type: inputType } = await demuxProbe(readableStream);
    return createAudioResource(stream, { inputType });
  }

  playResource(stream: any): void {
    this.probeAndCreateResource(stream).then((data) => {
      this.player.play(data);
    });
  }

  async playFromQueue(): Promise<void> {
    let lastUrl = this.queue.pop();

    if (!lastUrl) return;

    let stream = await ytdl(lastUrl, {
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });

    this.playResource(stream);
  }

  addToQueue(url: string): void {
    this.queue.push(url);

    if (this.player.state.status === AudioPlayerStatus.Idle) {
      this.playFromQueue();
    }
  }
}
