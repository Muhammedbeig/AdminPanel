export const ADMIN_SITE_NAME = "Admin Panel";

export const ADMIN_TITLES = {
  // --- MAIN ---
  dashboard: "Dashboard",
  media: "Media Library",

  // --- BLOGS ---
  blogs: {
    list: "All Blog Posts",
    new: "Create New Post",
    edit: "Edit Post",
    categories: "Blog Categories",
  },

  // --- KNOWLEDGE BASE (FAQs) ------
  faqs: {
    list: "FAQ Manager",
    new: "Add New FAQ",
    edit: "Edit FAQ",
    categories: "FAQ Categories",
  },

  // --- SEO MANAGER ---
  seo: {
    global: "Global SEO Settings",
    match: "Match SEO Settings",
    league: "League SEO Settings",
    player: "Player SEO Settings",
    redirects: "Redirect Manager",
    sitemap: "Sitemap Manager",
    brokenLinks: "Broken Link Checker",
    robots: "Robots.txt Editor",
    pages: {
      terms: "Edit Terms of Service",
      privacy: "Edit Privacy Policy",
      contact: "Edit Contact Page",
    },
  },

  // --- SETTINGS ---
  settings: {
    system: "System Settings",
    web: "Web Settings",
    members: "Team Members",
  },
  
  // --- USER ---
  profile: "My Profile",
};

/**
 * Helper to generate Next.js Metadata object
 * Usage: export const metadata = genMeta(ADMIN_TITLES.dashboard);
 */
export function genMeta(pageTitle: string) {
  return {
    title: `${pageTitle} || ${ADMIN_SITE_NAME}`,
  };
}