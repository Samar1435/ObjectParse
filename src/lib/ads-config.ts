export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "ca-pub-5357747063200983";

export const AD_SLOTS = {
  leaderboard: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD ?? "",
  rectangle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "",
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "",
  inContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "",
};
