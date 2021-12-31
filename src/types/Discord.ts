import DiscordJS, { ApplicationCommandDataResolvable } from "discord.js";

export type event = keyof DiscordJS.ClientEvents;

export type commandCreationResponse = {
  created: ApplicationCommandDataResolvable[];
  notCreated: ApplicationCommandDataResolvable[];
};
