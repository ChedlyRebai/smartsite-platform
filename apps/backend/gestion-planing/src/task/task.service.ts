
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Body, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '@/task/entities/task.entity';
import { Milestone } from '@/milestone/entities/milestone.entity';
@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}
  async create(createTaskDto: CreateTaskDto) {
    const response = await this.milestoneModel
      .findById(createTaskDto.milestoneId)
      .exec();
    if (!response) {
      throw new Error(
        `Milestone with id ${createTaskDto.milestoneId} not found`,
      );
    }
    const newTask = await this.taskModel.create(createTaskDto);
    response.tasks.push(newTask._id);
    await response.save();
    return newTask;
  }

  async findAll() {
    try {
      const response = await this.taskModel.find().exec();
      return response;
    } catch (error) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  async findOne(id: number) {
    try {
      const response = await this.taskModel.findById(id).exec();
      return response;
    } catch (error) {
      throw new Error(`Error fetching task: ${error.message}`);
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    try {
      const response = await this.taskModel
        .findByIdAndUpdate(id, updateTaskDto, { new: true })
        .exec();
      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const response = await this.taskModel.findByIdAndDelete(id).exec();
      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error) {
      throw new Error(`Error removing task: ${error.message}`);
    }
  }

  async getTasksBYMilestoneId(milestoneId: string) {
  try {
    const response = await this.taskModel
      .aggregate([
       
        { $match: { milestoneId } },

      
        {
          $group: {
            _id: '$status',
            tasks: { $push: '$$ROOT' }, 
          },
        },

        
        {
          $project: {
            title: '$_id',
            tasks: 1,
            _id: 0,
          },
        },
      ])
      .exec();
      const columns= response.map((group,i) => ({
      id: `${group.title}`, // or use uuid/v4 for random unique id
      title: group.title,
      color: getColorForStatus(group.status),
      tasks: group.tasks,
    }));

    return columns;
    
  } catch (error: any) {
    throw new Error(
      `Error fetching tasks by milestone id: ${error.message}`
    );
  }
}
}
function getColorForStatus(status: string) {
  return "primary"
}

