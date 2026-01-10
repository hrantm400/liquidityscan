import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CreateLessonDto, UpdateLessonDto, UpdateUserDto, CreateContentDto, UpdateContentDto } from './dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(page: number = 1, limit: number = 50, search?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            subscription: true,
            _count: {
              select: {
                strategies: true,
                signalAlerts: true,
                courseProgress: true,
              },
            },
          },
        }).catch((error) => {
          this.logger.error('Error fetching users:', error);
          return [];
        }),
        this.prisma.user.count({ where }).catch(() => 0),
      ]);

      return {
        data: users,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error in getAllUsers:', error);
      return {
        data: [],
        total: 0,
        page,
        pageCount: 0,
      };
    }
  }

  async getUserById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          subscription: true,
          strategies: true,
          signalAlerts: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          courseProgress: {
            include: {
              course: true,
              lesson: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error in getUserById:', error);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        subscription: true,
      },
    });

    this.logger.log(`User updated: ${user.email}`);
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`User deleted: ${user.email}`);
    return user;
  }

  // ==================== COURSE MANAGEMENT ====================

  async getAllCourses(page: number = 1, limit: number = 50, filters?: { category?: string; published?: boolean; search?: string }) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.published !== undefined) {
        where.published = filters.published;
      }
      
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
        ];
      }

      const [courses, total] = await Promise.all([
        this.prisma.course.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                lessons: true,
                progress: true,
              },
            },
          },
        }).catch((error) => {
          this.logger.error('Error fetching courses:', error);
          return [];
        }),
        this.prisma.course.count({ where }).catch(() => 0),
      ]);

      return {
        data: courses,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error in getAllCourses:', error);
      return {
        data: [],
        total: 0,
        page,
        pageCount: 0,
      };
    }
  }

  async getCourseById(id: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              progress: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      return course;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error in getCourseById:', error);
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }

  async createCourse(createCourseDto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        rating: createCourseDto.rating || 0,
        students: createCourseDto.students || 0,
      },
    });

    this.logger.log(`Course created: ${course.title}`);
    return course;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });

    this.logger.log(`Course updated: ${course.title}`);
    return course;
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.delete({
      where: { id },
    });

    this.logger.log(`Course deleted: ${course.title}`);
    return course;
  }

  async publishCourse(id: string, published: boolean) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { published },
    });

    this.logger.log(`Course ${published ? 'published' : 'unpublished'}: ${course.title}`);
    return course;
  }

  // ==================== LESSON MANAGEMENT ====================

  async getLessonsByCourse(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    return lessons;
  }

  async createLesson(courseId: string, createLessonDto: CreateLessonDto) {
    // Get the highest order number for this course
    const maxOrder = await this.prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = createLessonDto.order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const lesson = await this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        courseId,
        order,
        content: createLessonDto.content || {},
      },
    });

    this.logger.log(`Lesson created: ${lesson.title} for course ${courseId}`);
    return lesson;
  }

  async updateLesson(id: string, updateLessonDto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
    });

    this.logger.log(`Lesson updated: ${lesson.title}`);
    return lesson;
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.delete({
      where: { id },
    });

    this.logger.log(`Lesson deleted: ${lesson.title}`);
    return lesson;
  }

  async reorderLessons(courseId: string, lessonOrders: { id: string; order: number }[]) {
    // Update all lessons in a transaction
    await this.prisma.$transaction(
      lessonOrders.map(({ id, order }) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order },
        })
      )
    );

    this.logger.log(`Lessons reordered for course ${courseId}`);
    return { success: true };
  }

  // ==================== SIGNAL MANAGEMENT ====================

  async getAllSignals(page: number = 1, limit: number = 100, filters?: { strategyType?: string; symbol?: string; status?: string }) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters?.strategyType) {
        where.strategyType = filters.strategyType;
      }
      
      if (filters?.symbol) {
        where.symbol = { contains: filters.symbol, mode: 'insensitive' as const };
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }

      const [signals, total] = await Promise.all([
        this.prisma.signal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { detectedAt: 'desc' },
        }).catch((error) => {
          this.logger.error('Error fetching signals:', error);
          return [];
        }),
        this.prisma.signal.count({ where }).catch(() => 0),
      ]);

      return {
        data: signals,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error in getAllSignals:', error);
      return {
        data: [],
        total: 0,
        page,
        pageCount: 0,
      };
    }
  }

  async deleteSignal(id: string) {
    const signal = await this.prisma.signal.delete({
      where: { id },
    });

    this.logger.log(`Signal deleted: ${signal.id}`);
    return signal;
  }

  async updateSignalStatus(id: string, status: string) {
    const signal = await this.prisma.signal.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Signal status updated: ${signal.id} -> ${status}`);
    return signal;
  }

  // ==================== ANALYTICS ====================

  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalCourses,
        publishedCourses,
        totalSignals,
        activeSignals,
        totalLessons,
        recentUsers,
        recentCourses,
      ] = await Promise.all([
        this.prisma.user.count().catch(() => 0),
        this.prisma.course.count().catch(() => 0),
        this.prisma.course.count({ where: { published: true } }).catch(() => 0),
        this.prisma.signal.count().catch(() => 0),
        this.prisma.signal.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        this.prisma.lesson.count().catch(() => 0),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }).catch(() => 0),
        this.prisma.course.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }).catch(() => 0),
      ]);

      return {
        users: {
          total: totalUsers,
          recentWeek: recentUsers,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          recentWeek: recentCourses,
        },
        signals: {
          total: totalSignals,
          active: activeSignals,
        },
        lessons: {
          total: totalLessons,
        },
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      // Return default values if there's an error
      return {
        users: {
          total: 0,
          recentWeek: 0,
        },
        courses: {
          total: 0,
          published: 0,
          recentWeek: 0,
        },
        signals: {
          total: 0,
          active: 0,
        },
        lessons: {
          total: 0,
        },
      };
    }
  }

  async getUserStats(period: 'day' | 'week' | 'month' = 'week') {
    try {
      const periodMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };

      const since = new Date(Date.now() - periodMs[period]);

      const [registrations, activeCourses] = await Promise.all([
        this.prisma.user.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: { gte: since },
          },
          _count: true,
        }).catch(() => []),
        this.prisma.courseProgress.groupBy({
          by: ['userId'],
          where: {
            updatedAt: { gte: since },
          },
          _count: true,
        }).catch(() => []),
      ]);

      return {
        registrations: registrations.length,
        activeUsers: activeCourses.length,
      };
    } catch (error) {
      this.logger.error('Error in getUserStats:', error);
      return {
        registrations: 0,
        activeUsers: 0,
      };
    }
  }

  async getCourseStats() {
    try {
      const [byCategory, byLevel, topRated] = await Promise.all([
        this.prisma.course.groupBy({
          by: ['category'],
          _count: true,
        }).catch(() => []),
        this.prisma.course.groupBy({
          by: ['level'],
          _count: true,
        }).catch(() => []),
        this.prisma.course.findMany({
          take: 10,
          orderBy: { rating: 'desc' },
          select: {
            id: true,
            title: true,
            rating: true,
            students: true,
          },
        }).catch(() => []),
      ]);

      return {
        byCategory,
        byLevel,
        topRated,
      };
    } catch (error) {
      this.logger.error('Error in getCourseStats:', error);
      return {
        byCategory: [],
        byLevel: [],
        topRated: [],
      };
    }
  }

  async getSignalStats(period: 'day' | 'week' | 'month' = 'week') {
    try {
      const periodMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };

      const since = new Date(Date.now() - periodMs[period]);

      const [byStrategy, byTimeframe, byStatus] = await Promise.all([
        this.prisma.signal.groupBy({
          by: ['strategyType'],
          where: {
            detectedAt: { gte: since },
          },
          _count: true,
        }).catch(() => []),
        this.prisma.signal.groupBy({
          by: ['timeframe'],
          where: {
            detectedAt: { gte: since },
          },
          _count: true,
        }).catch(() => []),
        this.prisma.signal.groupBy({
          by: ['status'],
          _count: true,
        }).catch(() => []),
      ]);

      return {
        byStrategy,
        byTimeframe,
        byStatus,
      };
    } catch (error) {
      this.logger.error('Error in getSignalStats:', error);
      return {
        byStrategy: [],
        byTimeframe: [],
        byStatus: [],
      };
    }
  }

  // ==================== CONTENT MANAGEMENT ====================

  async getAllContent(page: number = 1, limit: number = 50, filters?: { type?: string; published?: boolean }) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters?.type) {
        where.type = filters.type;
      }
      
      if (filters?.published !== undefined) {
        where.published = filters.published;
      }

      const [content, total] = await Promise.all([
        this.prisma.content.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }).catch((error) => {
          this.logger.error('Error fetching content:', error);
          return [];
        }),
        this.prisma.content.count({ where }).catch(() => 0),
      ]);

      return {
        data: content,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error in getAllContent:', error);
      return {
        data: [],
        total: 0,
        page,
        pageCount: 0,
      };
    }
  }

  async createContent(createContentDto: CreateContentDto) {
    const content = await this.prisma.content.create({
      data: createContentDto,
    });

    this.logger.log(`Content created: ${content.title}`);
    return content;
  }

  async updateContent(id: string, updateContentDto: UpdateContentDto) {
    const content = await this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });

    this.logger.log(`Content updated: ${content.title}`);
    return content;
  }

  async deleteContent(id: string) {
    const content = await this.prisma.content.delete({
      where: { id },
    });

    this.logger.log(`Content deleted: ${content.title}`);
    return content;
  }

  async publishContent(id: string, published: boolean) {
    const content = await this.prisma.content.update({
      where: { id },
      data: { published },
    });

    this.logger.log(`Content ${published ? 'published' : 'unpublished'}: ${content.title}`);
    return content;
  }

  // ==================== SETTINGS ====================

  async getSettings() {
    // Settings can be stored in a separate table or env variables
    // For now, return basic configuration
    return {
      adminEmails: process.env.ADMIN_EMAILS?.split(',') || [],
      javaBot: {
        enabled: !!process.env.JAVA_BOT_URL,
        url: process.env.JAVA_BOT_URL,
      },
      exchanges: {
        binance: {
          enabled: !!process.env.BINANCE_API_KEY,
        },
        mexc: {
          enabled: !!process.env.MEXC_API_KEY,
        },
      },
    };
  }
}
