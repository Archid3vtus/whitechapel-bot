import {
  CreateVoiceConnectionOptions,
  JoinVoiceChannelOptions,
  VoiceConnection,
} from "@discordjs/voice";
import DiscordJS, {
  ApplicationCommandDataResolvable,
  Awaitable,
  Client,
  ClientEvents,
  Interaction,
  VoiceBasedChannel,
} from "discord.js";
import { event } from "../types/Discord";

export interface IDiscord {
  client: Client<boolean>;
  on<K extends keyof ClientEvents>(
    event: K,
    callback: (...args: ClientEvents[K]) => Awaitable<void>
  ): void;
  login(token: string): void;
  getRequesterVoiceChannel(interaction: Interaction): string;
  joinVoiceChannel(
    options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): VoiceConnection;
}
