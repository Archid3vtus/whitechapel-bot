import {
  AudioPlayer,
  CreateVoiceConnectionOptions,
  JoinVoiceChannelOptions,
} from "@discordjs/voice";
import {
  ApplicationCommandManager,
  Awaitable,
  Client,
  ClientEvents,
  Guild,
  GuildApplicationCommandManager,
  Interaction,
} from "discord.js";
import { event } from "../types/Discord";

export interface IDiscord {
  client: Client<boolean>;
  guild: Guild | undefined;
  commands:
    | GuildApplicationCommandManager
    | ApplicationCommandManager
    | undefined;
  player: AudioPlayer;
  queue: string[];
  on<K extends keyof ClientEvents>(
    event: K,
    callback: (...args: ClientEvents[K]) => Awaitable<void>
  ): void;
  login(token: string): void;
  getRequesterVoiceChannel(interaction: Interaction): string;
  joinVoiceChannel(
    options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): void;
  playResource(stream: any): void;
  playFromQueue(): void;
  addToQueue(url: string): void;
  stop(): void;
  skip(): string;
}
