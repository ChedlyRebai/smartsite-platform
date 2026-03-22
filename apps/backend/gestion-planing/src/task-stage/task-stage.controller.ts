import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStage } from './entities/TaskStage.entities';

@Controller('task-stage')
export class TaskStageController {
  constructor(private readonly taskStageService: TaskStageService) {}

  @Get()
  async findAll() {
    return await this.taskStageService.findAll();
  }

  @Get('project/:projectId')
  async findByprojectId(@Param('projectId') projectId: string) {
    const taskStages = await this.taskStageService.findByProjectId(projectId);
    return taskStages;
  }
  @Post("project/:projectId")
  async create(@Param("projectId") projectId:string , @Body() taskStage:TaskStage){
    return this.taskStageService.create(projectId,taskStage)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.taskStageService.findONe(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() taskStage: TaskStage) {
    return await this.taskStageService.update(id, taskStage);
  }

  @Delete(':id')
  async removeTaskSatge(@Param('id') id: string) {
    return await this.taskStageService.remove(id);
  }
}
