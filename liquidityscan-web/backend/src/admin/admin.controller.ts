import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Admin } from './decorators/admin.decorator';
import { CreateCourseDto, UpdateCourseDto, CreateLessonDto, UpdateLessonDto, UpdateUserDto, CreateContentDto, UpdateContentDto } from './dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== USER MANAGEMENT ====================

  @Admin()
  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
    );
  }

  @Admin()
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Admin()
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Admin()
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
  }

  // ==================== COURSE MANAGEMENT ====================

  @Admin()
  @Get('courses')
  async getAllCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('published') published?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllCourses(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      {
        category,
        published: published ? published === 'true' : undefined,
        search,
      },
    );
  }

  @Admin()
  @Get('courses/:id')
  async getCourseById(@Param('id') id: string) {
    return this.adminService.getCourseById(id);
  }

  @Admin()
  @Post('courses')
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.adminService.createCourse(createCourseDto);
  }

  @Admin()
  @Put('courses/:id')
  async updateCourse(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.adminService.updateCourse(id, updateCourseDto);
  }

  @Admin()
  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id') id: string) {
    await this.adminService.deleteCourse(id);
  }

  @Admin()
  @Post('courses/:id/publish')
  async publishCourse(@Param('id') id: string, @Body('published') published: boolean) {
    return this.adminService.publishCourse(id, published);
  }

  // ==================== LESSON MANAGEMENT ====================

  @Admin()
  @Get('courses/:courseId/lessons')
  async getLessonsByCourse(@Param('courseId') courseId: string) {
    return this.adminService.getLessonsByCourse(courseId);
  }

  @Admin()
  @Post('courses/:courseId/lessons')
  async createLesson(
    @Param('courseId') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.adminService.createLesson(courseId, createLessonDto);
  }

  @Admin()
  @Put('lessons/:id')
  async updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.adminService.updateLesson(id, updateLessonDto);
  }

  @Admin()
  @Delete('lessons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(@Param('id') id: string) {
    await this.adminService.deleteLesson(id);
  }

  @Admin()
  @Put('lessons/reorder')
  async reorderLessons(
    @Body('courseId') courseId: string,
    @Body('lessonOrders') lessonOrders: { id: string; order: number }[],
  ) {
    return this.adminService.reorderLessons(courseId, lessonOrders);
  }

  // ==================== SIGNAL MANAGEMENT ====================

  @Admin()
  @Get('signals')
  async getAllSignals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('strategyType') strategyType?: string,
    @Query('symbol') symbol?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllSignals(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 100,
      { strategyType, symbol, status },
    );
  }

  @Admin()
  @Delete('signals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSignal(@Param('id') id: string) {
    await this.adminService.deleteSignal(id);
  }

  @Admin()
  @Put('signals/:id/status')
  async updateSignalStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateSignalStatus(id, status);
  }

  // ==================== ANALYTICS ====================

  @Admin()
  @Get('analytics/dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Admin()
  @Get('analytics/users')
  async getUserStats(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.adminService.getUserStats(period || 'week');
  }

  @Admin()
  @Get('analytics/courses')
  async getCourseStats() {
    return this.adminService.getCourseStats();
  }

  @Admin()
  @Get('analytics/signals')
  async getSignalStats(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.adminService.getSignalStats(period || 'week');
  }

  // ==================== CONTENT MANAGEMENT ====================

  @Admin()
  @Get('content')
  async getAllContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('published') published?: string,
  ) {
    return this.adminService.getAllContent(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      {
        type,
        published: published ? published === 'true' : undefined,
      },
    );
  }

  @Admin()
  @Post('content')
  async createContent(@Body() createContentDto: CreateContentDto) {
    return this.adminService.createContent(createContentDto);
  }

  @Admin()
  @Put('content/:id')
  async updateContent(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.adminService.updateContent(id, updateContentDto);
  }

  @Admin()
  @Delete('content/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContent(@Param('id') id: string) {
    await this.adminService.deleteContent(id);
  }

  @Admin()
  @Post('content/:id/publish')
  async publishContent(@Param('id') id: string, @Body('published') published: boolean) {
    return this.adminService.publishContent(id, published);
  }

  // ==================== SETTINGS ====================

  @Admin()
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }
}
