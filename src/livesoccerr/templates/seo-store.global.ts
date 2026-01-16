export const LSOCCERR_GLOBAL_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-23T00:00:00Z",
  brand: {
    siteName: "Live Score",
    siteUrl: "https://livesoccerr.com",
    siteDomain: "livesoccerr.com",
    tagline: "Soccer Scores. Right Now.",
    logoTitle: "LiveSocceRR Scores",
    logoUrl: "/brand/logo.svg",
    titlePrefix: "",
    titleSuffix: "",
    defaultOgImage: "/og.png",
    defaultMetaDescription:
      "Live scores, results, fixtures and stats across football, basketball, NFL, hockey, rugby, volleyball and more.",
    locale: "en_US",
  },
  labels: {
    sportLabels: {
      football: "Football",
      soccer: "Football",
      basketball: "Basketball",
      nfl: "NFL",
      "american-football": "NFL",
      hockey: "Hockey",
      "ice-hockey": "Hockey",
      baseball: "Baseball",
      rugby: "Rugby",
      volleyball: "Volleyball",
    },
  },
  header: {
    nav: {
      desktopVisibleCount: 6,
      mobileTop: ["football", "basketball", "nfl"],
      allSports: [
        { id: "football", icon: "⚽" },
        { id: "basketball", icon: "🏀" },
        { id: "nfl", icon: "🏈" },
        { id: "baseball", icon: "⚾" },
        { id: "hockey", icon: "🏒" },
        { id: "rugby", icon: "🏉" },
        { id: "volleyball", icon: "🏐" },
      ],
    },
  },
  footer: {
    aboutText:
      "{siteName} delivers fast, real-time scores, fixtures, results, standings, and match stats across football, basketball, NFL, hockey, baseball, rugby, volleyball and more — all in one place.",
    appLinks: {
      googlePlay: "#",
      appStore: "#",
    },
    socials: {
      twitter: "#",
      facebook: "#",
      instagram: "#",
      youtube: "#",
    },
  },
  defaults: {
    robots: "index, follow",
    keywords: [
      "live scores",
      "soccer scores",
      "football live scores",
      "basketball live scores",
      "nfl live scores",
      "hockey live scores",
      "baseball live scores",
      "rugby live scores",
      "volleyball live scores",
    ],
    og: {
      type: "website",
      fallbackImage: "/og.png",
      imageAlt: "Live Scores for Football, Basketball, NFL, Hockey, Rugby, Volleyball & More",
    },
    twitter: {
      card: "summary_large_image",
      fallbackImage: "/og.png",
    },
  },
  auto: {
    autoTitlePattern: "{title} | {brand}",
    autoDescriptionPattern: "{description}",
    autoSchema: true,
  },
  home: {
    title: "Live Soccer & All Sports Scores | Football, Basketball, NFL…",
    description:
      "Get live scores, results, fixtures, and updates for football, basketball, NFL, baseball, hockey, rugby, volleyball, and more. Follow your favorite teams instantly.",
    h1: "Live Scores & Results",
    primaryKeyword: "live scores",
    keywords: [
      "live scores",
      "soccer scores",
      "football live scores",
      "basketball live scores",
      "nfl live scores",
      "hockey live scores",
      "baseball live scores",
      "rugby live scores",
      "volleyball live scores",
    ],
    canonical: "/",
  },
  overrides: {},
} as const;

export default LSOCCERR_GLOBAL_TEMPLATE;
