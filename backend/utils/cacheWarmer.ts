import { prisma } from '../config/prisma.js';
import { CacheService, CacheKeys, CacheTTL } from './cache.js';

export const warmCache = async () => {
  console.log('Starting cache warm-up...');
  const startTime = Date.now();

  try {
    const homeContent = await prisma.pageContent.findMany({
      where: { page: 'home' },
      orderBy: [{ section: 'asc' }, { contentKey: 'asc' }],
    });

    const structuredHomeContent: Record<string, any> = {};
    homeContent.forEach(item => {
      const key = `${item.section}_${item.contentKey}`;
      structuredHomeContent[key] = {
        id: item.id,
        value: item.contentValue,
        type: item.contentType,
      };
    });

    await CacheService.set(CacheKeys.pageContent('home'), structuredHomeContent, CacheTTL.PAGE_CONTENT);
    console.log('Cached home page content');

    const [announcements, announcementsTotal] = await Promise.all([
      prisma.announcements.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        include: { tags: true },
        take: 3,
        skip: 0,
      }),
      prisma.announcements.count({ where: { isPublished: true } }),
    ]);

    const announcementsResponse = {
      data: announcements,
      pagination: {
        total: announcementsTotal,
        page: 1,
        limit: 3,
        totalPages: Math.ceil(announcementsTotal / 3),
        hasMore: announcements.length < announcementsTotal,
      },
    };

    await CacheService.set(CacheKeys.announcements(1, 3, true), announcementsResponse, CacheTTL.ANNOUNCEMENTS_LIST);
    console.log('Cached announcements');

    const [blogs, blogsTotal] = await Promise.all([
      prisma.blog.findMany({
        where: { isPublished: true },
        include: { tags: true },
        orderBy: { publishedDate: 'desc' },
        take: 2,
        skip: 0,
      }),
      prisma.blog.count({ where: { isPublished: true } }),
    ]);

    const blogsResponse = {
      data: blogs,
      pagination: {
        total: blogsTotal,
        page: 1,
        limit: 2,
        totalPages: Math.ceil(blogsTotal / 2),
        hasMore: blogs.length < blogsTotal,
      },
    };

    await CacheService.set(CacheKeys.blogs(1, 2), blogsResponse, CacheTTL.BLOGS_LIST);
    console.log('Cached blogs');

    const duration = Date.now() - startTime;
    console.log(`Cache warm-up completed in ${duration}ms`);
  } catch (error) {
    console.error('Cache warm-up failed:', error);
  }
};
