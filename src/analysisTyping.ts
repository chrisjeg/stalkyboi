export enum Pattern {
  All = "patterns.all",
  Fluctuating = "patterns.fluctuating",
  LargeSpike = "patterns.large-spike",
  Decreasing = "patterns.decreasing",
  SmallSpike = "patterns.small-spike",
}

export interface DiscordUser {
  id: string;
  name: string;
  imageUrl: string;
}

export type DiscordUsers = {
  [id: string]: DiscordUser;
};

export const patternToString: Record<Pattern, string> = {
  [Pattern.All]: "overall analysis",
  [Pattern.Fluctuating]: "fluctuating price",
  [Pattern.LargeSpike]: "large spike",
  [Pattern.SmallSpike]: "small spike",
  [Pattern.Decreasing]: "decreasing price",
};

export interface Analysis {
  pattern_description: Pattern;
  pattern_number: number;
  prices: { min: number; max: number }[];
  weekGuaranteedMinimum: number;
  weekMax: number;
  probability?: number;
}
