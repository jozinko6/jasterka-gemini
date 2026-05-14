import { prisma } from '../lib/prisma';

export const menuService = {
  async getCategories() {
    return await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  },

  async getMenuItemsBySlug(slug: string) {
    return await prisma.menuItem.findMany({
      where: {
        category: { slug },
        isActive: true
      },
      include: {
        category: true,
        options: true
      }
    });
  },

  async getFeaturedItems() {
    return await prisma.menuItem.findMany({
      where: { isActive: true },
      take: 6,
      include: { category: true }
    });
  }
};
