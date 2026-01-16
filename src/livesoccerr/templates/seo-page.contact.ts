export const SEO_PAGE_CONTACT_TEMPLATE = {
  schemaVersion: 1,
  updatedAt: "2025-12-23T00:00:00Z",
  slug: "contact",
  seo: {
    title: "Contact Us | LiveSocceRR",
    description: "Contact LiveSocceRR for support, bug reports, and feedback.",
    h1: "Contact Us",
    primaryKeyword: "contact livesoccerr",
    keywords: ["contact", "support", "feedback", "LiveSocceRR contact"],
    canonical: "/contact",
    robots: { index: true, follow: true },
    ogTitle: "Contact Us | LiveSocceRR",
    ogDescription: "Reach LiveSocceRR at service@livesoccerr.com.",
    ogImage: "/og.png",
  },
  content: {
    h1: "Contact Us",
    lastUpdated: "December 17, 2025",
    intro: [
      "To make sure your query or feedback gets to the right person, please contact us via email.",
      "We review every message and will get back to you if we need more information."
    ],
    contactDetails: {
      supportEmail: "service@livesoccerr.com",
      phone: "+92 300 0000000",
      whatsapp: "+92 300 0000000",
      address: ["Your Company Address Line 1", "City, Country"],
      supportHours: "Mon–Sun, 24/7"
    },
    sections: [
      {
        title: "What you can contact us about",
        blocks: [
          {
            type: "ul",
            items: [
              "Technical support",
              "Bug reports",
              "Feedback and feature requests",
              "Partnerships"
            ]
          }
        ]
      },
      {
        title: "Email",
        blocks: [{ type: "p", text: "Email us at service@livesoccerr.com." }]
      }
    ],
    note: "We will use only email for contacting."
  }
};

export default SEO_PAGE_CONTACT_TEMPLATE;