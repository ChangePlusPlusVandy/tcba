import redisClient from '../config/redis.js';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache get');
        return null;
      }

      const data = await redisClient.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache set');
        return;
      }

      if (ttl === undefined || ttl === 0) {
        await redisClient.set(key, JSON.stringify(value));
      } else {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache delete');
        return;
      }

      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  static async deletePattern(pattern: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache delete');
        return;
      }

      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  static async clear(): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache clear');
        return;
      }

      await redisClient.flushDb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export const CacheKeys = {
  pageContent: (page: string) => `page-content:${page}`,
  pageContentAll: () => `page-content:*`,
  announcements: (page: number, limit: number, isPublished?: boolean) =>
    `announcements:${page}:${limit}:${isPublished ?? 'all'}`,
  announcementsAll: () => `announcements:*`,
  announcementBySlug: (slug: string) => `announcement:slug:${slug}`,
  blogs: (page: number, limit: number) => `blogs:${page}:${limit}`,
  blogsAll: () => `blogs:*`,
  blogBySlug: (slug: string) => `blog:slug:${slug}`,
  alerts: (page: number, limit: number, isPublished?: boolean, priority?: string) =>
    `alerts:${page}:${limit}:${isPublished ?? 'all'}:${priority ?? 'all'}`,
  alertsAll: () => `alerts:*`,
  alertById: (id: string) => `alert:id:${id}`,
  tags: () => `tags:all`,
  blogTags: () => `blog-tags:all`,
};

export const CacheTTL = {
  PAGE_CONTENT: 1800,
  ANNOUNCEMENTS_LIST: 300,
  ANNOUNCEMENT_DETAIL: 600,
  BLOGS_LIST: 300,
  BLOG_DETAIL: 600,
  ALERTS_LIST: 180,
  ALERT_DETAIL: 300,
  TAGS: 900,
};
