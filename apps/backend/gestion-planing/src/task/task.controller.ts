import {
  Body,
  Controller,
  Delete,
  Get,
  UnauthorizedException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtGuard } from '@/auth/jwt.guard/jwt.guard';
import { GetUser } from '@/auth/get-user.decorator';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  // /milestone/69bc78a30912805125e58f72
  // 'localhost:3002/task/milestone/:milestoneId/task-stage/:taskStageId'
  @Post('/milestone/:milestoneId/task-stage/:taskStageId')
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Param('milestoneId') milestoneId: string,
    @Param('taskStageId') taskStageId: string,
  ) {
    return this.taskService.create(createTaskDto, milestoneId, taskStageId);
  }

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  //${baseUrl}/task/${taskId}/task-stage/${colunId}
  @Put('/:taskId/task-stage/:colunId')
  updateTaskStage(
    @Param('taskId') taskId: string,
    @Param('colunId') colunId: string,
  ) {
    return this.taskService.updateNew(taskId, colunId);
  }

  @UseGuards(JwtGuard)
  @Get('/my-tasks')
  getMytasks(@GetUser() user: any) {
    const userId = user?.sub || user?.userId || user?.id || user?._id;
    console.log('Extracted user ID from token payload:', user);
    if (!userId) {
      throw new UnauthorizedException('User ID missing in token payload');
    }

    return this.taskService.getMyTasks(userId);
  }

  @Get('milestone/:milestoneId')
  findBYmilestoneId(@Param('milestoneId') milestoneId: string) {
    return this.taskService.getTasksBYMilestoneId(milestoneId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.taskService.remove(id);
  }
}
