import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 1. Fetch Global Settings
  const settings = await prisma.sitemapSettings.findFirst() || {
    homePriority: 1.0,
    postPriority: 0.9,
    pagePriority: 0.8
  };

  // 2. Static Pages (Use pagePriority, except Home)
  const staticRoutes = ["", "/blogs", "/about", "/contact", "/privacy", "/terms"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? settings.homePriority : settings.pagePriority,
  }));

  // 3. Custom Links (Keep existing logic)
  const customDbLinks = await prisma.sitemapLink.findMany();
  const customRoutes = customDbLinks.map((link) => ({
    url: `${baseUrl}${link.path}`,
    lastModified: link.updatedAt,
    changeFrequency: link.frequency as any,
    priority: link.priority,
  }));

  // 4. Blog Posts (Use postPriority)
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, deletedAt: null },
    select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
  });

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.category?.slug || "uncategorized"}/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: settings.postPriority,
  }));

  // 5. Categories (Use pagePriority)
  const categories = await prisma.blogCategory.findMany({ select: { slug: true } });
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/blog/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: settings.pagePriority,
  }));

  return [...staticRoutes, ...customRoutes, ...postUrls, ...categoryUrls];
}