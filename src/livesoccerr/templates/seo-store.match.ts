export const SEO_STORE_MATCH_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-23T00:00:00Z",
  labels: {
    matchTabLabels: {
      summary: "Score, Lineups & Stats",
      stats: "Stats",
      statistics: "Stats",
      lineups: "Lineups",
      h2h: "Head-to-Head",
      standings: "Standings",
      odds: "Odds",
      results: "Result",
      fixtures: "Fixture",
    },
  },
  match: {
    revalidateSeconds: 60,
    apiTimeoutMs: 650,
    primaryKeyword: "live score",
    titlePatterns: [
      "MATCH: {home} vs {away} – Score, Lineups & Stats",
      "MATCH: {home} vs {away} – Score & Lineups",
      "{home} vs {away} Live Score",
    ],
    descriptionPattern:
      "Watch live score updates of {home} vs {away} with goals, lineups, news & match timeline. Fast updates on {brand}.",
    h1Pattern: "LIVE: {home} vs {away}",
    og: {
      useDynamicBanner: true,
      bannerPath: "/og/match/{sport}/{id}",
      fallbackImage: "/og.png",
    },
    schema: {
      enabled: true,
    },
  },
};

export default SEO_STORE_MATCH_TEMPLATE;