export const SEO_STORE_LEAGUE_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-23T00:00:00Z",
  labels: {
    sportsTabLabels: {
      all: "Today",
      today: "Today",
      live: "Live Now",
      finished: "Final Scores",
      scheduled: "Upcoming Fixtures",
      results: "Results",
      fixtures: "Fixtures",
      standings: "Standings",
    },
  },
  league: {
    revalidateSeconds: 86400,
    apiTimeoutMs: 2000,
    primaryKeyword: "league table",
    titlePatterns: [
      "{name} ({country}) Live Scores, Results & Fixtures | {brand}",
      "{name} {season} Table & Results – {brand}",
    ],
    descriptionPattern:
      "Follow {name} ({country}) live scores, results, fixtures, and standings. Get real-time updates for {name} on {brand}.",
    h1Pattern: "{name} – Live Scores & Standings",
    og: {
      fallbackImage: "/og.png",
    },
    schema: {
      enabled: true,
    },
  },
};

export default SEO_STORE_LEAGUE_TEMPLATE;