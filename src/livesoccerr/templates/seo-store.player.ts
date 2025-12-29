export const SEO_STORE_PLAYER_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-23T00:00:00Z",
  player: {
    revalidateSeconds: 3600,
    apiTimeoutMs: 1200,
    primaryKeyword: "player stats",
    titlePatterns: [
      "{name} Stats & Profile | {team} | {brand}",
      "{name} – {team} Player Stats, Matches & News | {brand}",
      "{name} ({sport}) Stats, Profile & Updates | {brand}",
      "{name} Player Profile & Stats | {brand}",
    ],
    descriptionPattern:
      "View {name} player profile, stats, matches, and latest updates for {team} in {sport}. Fast updates on {brand}.",
    h1Pattern: "{name} – Player Profile & Stats",
    og: {
      fallbackImage: "/og.png",
    },
    schema: {
      enabled: true,
    },
  },
};

export default SEO_STORE_PLAYER_TEMPLATE;