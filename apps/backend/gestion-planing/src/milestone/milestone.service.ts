import { Injectable } from '@nestjs/common';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestoneService {
  create(createMilestoneDto: CreateMilestoneDto) {
    return 'This action adds a new milestone';
  }

  findAll() {
    return `This action returns all milestone`;
  }

  findOne(id: number) {
    return `This action returns a #${id} milestone`;
  }

  update(id: number, updateMilestoneDto: UpdateMilestoneDto) {
    return `This action updates a #${id} milestone`;
  }

  remove(id: number) {
    return `This action removes a #${id} milestone`;
  }
}
