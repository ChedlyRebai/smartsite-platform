
import { Body, Injectable } from '@nestjs/common';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { Milestone } from './entities/milestone.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '@/task/entities/task.entity';

@Injectable()
export class MilestoneService {
  constructor(
  @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
  @InjectModel(Task.name) private taskModel: Model<Task>,
  
){

  }
  async create(createMilestoneDto: CreateMilestoneDto) {
    const newMilestone=await this.milestoneModel.create(createMilestoneDto);
    return newMilestone;
  }

  async findAll() {
    const milestones=await this.milestoneModel.find().populate('tasks').exec();
    return milestones;
  }

  async findOne(id: number) {
    const milestone = await this.milestoneModel.findById(id).populate("tasks").exec();
    return milestone;
  }

  async update(id: number, updateMilestoneDto: UpdateMilestoneDto) {
    const updatedMilestone=await this.milestoneModel.findByIdAndUpdate(id, updateMilestoneDto, { new: true }).populate("tasks").exec();
    if(!updatedMilestone){
      throw new Error(`Milestone with id ${id} not found`);
    }

    return updatedMilestone;
  }

   async getMilestonesByProjectId(projectId:string){
     const response = await this.milestoneModel.find({projectId:projectId}).populate("tasks").exec();
     return response; 
   }

  async remove(id: number) {
    const milestone = await this.milestoneModel.findByIdAndDelete(id).exec();
    if (!milestone) {
      throw new Error(`Milestone with id ${id} not found`);
    }
    return milestone;
  }
}
