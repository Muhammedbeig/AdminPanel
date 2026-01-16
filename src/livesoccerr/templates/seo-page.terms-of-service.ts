// app/admin/src/livesoccerr/templates/seo-page.terms-of-service.ts

const SEO_PAGE_TERMS_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-17T00:00:00Z",
  slug: "terms-of-service",
  seo: {
    title: "Terms of Service | LiveSocceRR",
    description:
      "These Terms of Service govern your access to and use of livesoccerr.com and related services provided by LiveSocceRR.",
    h1: "Terms of Service",
    primaryKeyword: "terms of service",
    keywords: [
      "terms of service",
      "terms and conditions",
      "acceptable use",
      "livesoccerr.com terms",
      "LiveSocceRR terms",
    ],
  },
  content: {
    h1: "Terms of Service",
    lastUpdated: "December 17, 2025",
    sections: [
      {
        title: "1. Introductory Provisions",
        blocks: [
          {
            type: "p",
            text:
              'These Terms of Service (the “Terms”) govern your access to and use of livesoccerr.com and any related services provided by LiveSocceRR (together, the “Services”). By accessing or using the Services, you agree to these Terms. If you do not agree, do not use the Services.',
          },
          {
            type: "p",
            text:
              "If you use the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.",
          },
        ],
      },

      {
        title: "2. The Services and Content",
        blocks: [
          {
            type: "p",
            text:
              "The Services provide sports information such as live scores, final results, fixtures, lineups, standings, and other statistics. Some information may be provided by third-party sources. We work to keep content accurate and updated, but we do not guarantee completeness or accuracy at all times.",
          },
          {
            type: "p",
            text:
              "You use and rely on the information from the Services at your own risk. The Services are provided for personal, non-commercial use unless we explicitly agree otherwise in writing.",
          },
        ],
      },

      {
        title: "3. Accounts and User Communications",
        blocks: [
          {
            type: "p",
            text:
              "If we offer account features, you are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to provide accurate information and to keep it updated.",
          },
          {
            type: "p",
            text:
              "We may suspend or terminate accounts that violate these Terms or pose a security risk.",
          },
        ],
      },

      {
        title: "4. Acceptable Use",
        blocks: [
          { type: "p", text: "You agree not to:" },
          {
            type: "ul",
            items: [
              "Use the Services for any unlawful purpose or in violation of applicable laws",
              "Scrape, crawl, harvest, or aggregate content from the Services without our written permission",
              "Reverse engineer, interfere with, or disrupt the Services, servers, or networks",
              "Attempt to bypass rate limits, access controls, or security mechanisms",
              "Use the Services for commercial purposes (including reselling, sublicensing, or embedding) without our written consent",
              "Upload or transmit malicious code, spam, or harmful content",
            ],
          },
          {
            type: "p",
            text:
              "We may take technical and legal measures to protect the Services, including blocking abusive traffic.",
          },
        ],
      },

      {
        title: "5. Intellectual Property",
        blocks: [
          {
            type: "p",
            text:
              "All content, trademarks, logos, and materials on the Services are owned by LiveSocceRR or its licensors and are protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Services or included software without our written permission.",
          },
        ],
      },

      {
        title: "6. Third-Party Content and Links",
        blocks: [
          {
            type: "p",
            text:
              "The Services may include third-party content, links, or integrations. We do not control third-party services and are not responsible for their content or practices. Your dealings with third parties are between you and the third party.",
          },
        ],
      },

      {
        title: "7. Betting Odds Disclaimer",
        blocks: [
          {
            type: "p",
            text:
              "If betting odds are displayed, they are provided for informational/news purposes only. The Services are not a gambling product and we do not facilitate wagering. You are solely responsible for any decisions you make based on displayed information.",
          },
        ],
      },

      {
        title: "8. Disclaimers",
        blocks: [
          {
            type: "p",
            text:
              "The Services are provided “as is” and “as available.” To the maximum extent permitted by law, we disclaim all warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.",
          },
        ],
      },

      {
        title: "9. Limitation of Liability",
        blocks: [
          {
            type: "p",
            text:
              "To the maximum extent permitted by law, in no event will we be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Services.",
          },
        ],
      },

      {
        title: "10. Termination",
        blocks: [
          {
            type: "p",
            text:
              "We may suspend or terminate your access to the Services at any time if you violate these Terms or if we reasonably believe it is necessary to protect the Services or other users. You may stop using the Services at any time.",
          },
        ],
      },

      {
        title: "11. Privacy",
        blocks: [
          {
            type: "p_rich",
            inlines: [
              { type: "text", value: "Your use of the Services is also governed by our Privacy Policy: " },
              { type: "link", label: "https://livesoccerr.com/privacy-policy", href: "https://livesoccerr.com/privacy-policy" },
              { type: "text", value: "." },
            ],
          },
        ],
      },

      {
        title: "12. Changes to These Terms",
        blocks: [
          {
            type: "p",
            text:
              "We may modify these Terms from time to time. We will update the “Last updated” date and, where appropriate, provide additional notice. Your continued use of the Services after the change means you accept the updated Terms.",
          },
        ],
      },

      {
        title: "13. Contact",
        blocks: [
          {
            type: "p",
            text: "For questions about these Terms, contact us at service@livesoccerr.com.",
          },
        ],
      },
    ],
  },
};

export default SEO_PAGE_TERMS_TEMPLATE;
