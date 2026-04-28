
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../task/entities/task.entity';
import { Milestone } from '../milestone/entities/milestone.entity';
import { TaskStage } from '../task-stage/entities/TaskStage.entities';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AffectedNotificationEventDto } from './dto/affected-notification-event.dto';

@Injectable()
export class TaskService implements OnModuleInit {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskStage.name) private taskSTageModel: Model<TaskStage>,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.notificationClient.connect();
      this.logger.log('Kafka connected successfully');
    } catch (error) {
      this.logger.warn('Kafka not available — notifications disabled. Start Kafka to enable.');
    }
  }

  private normalizeAssignedTeams(assignedTeams: unknown): string[] {
    if (!assignedTeams) {
      return [];
    }

    if (Array.isArray(assignedTeams)) {
      return assignedTeams
        .flat(Infinity)
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (typeof assignedTeams === 'string') {
      const raw = assignedTeams.trim();
      if (!raw) {
        return [];
      }

      if (raw.startsWith('[') && raw.endsWith(']')) {
        // Handles loosely serialized payloads like "[ [ 'id' ] ]".
        const matches = raw.match(/[a-fA-F0-9]{24}/g);
        return matches ? [...new Set(matches)] : [];
      }

      return [raw];
    }

    return [];
  }

  async create(
    createTaskDto: CreateTaskDto,
    milestoneId: string,
    taskStageId: string,
  ) {
    const response = await this.milestoneModel.findById(milestoneId).exec();
    if (!response) {
      throw new Error(`Milestone with id ${milestoneId} not found`);
    }

    const normalizedRecipients = this.normalizeAssignedTeams(
      createTaskDto.assignedTeams,
    );

    const newTask = await this.taskModel.create({
      ...createTaskDto,
      milestoneId,
      assignedTeams: normalizedRecipients,
    });

    await this.taskSTageModel
      .findByIdAndUpdate(taskStageId, {
        $push: { tasks: newTask._id },
      })
      .exec();

    response.tasks.push(newTask._id);
    await response.save();

    const eventPayload: AffectedNotificationEventDto = {
      title: `Task assigned: ${newTask.title}`,
      message: newTask.description
        ? `Task "${newTask.title}" has been created. ${newTask.description}`
        : `Task "${newTask.title}" has been created and assigned to your team.`,
      recipients: normalizedRecipients,
      priority:
        newTask.priority === 'CRITICAL' || newTask.priority === 'HIGH'
          ? 'HIGH'
          : newTask.priority === 'LOW'
            ? 'LOW'
            : 'MEDIUM',
      type: 'INFO',
      source: 'gestion-planing',
      taskId: newTask._id.toString(),
    };

    try {
      await firstValueFrom(
        this.notificationClient.emit('task.created', eventPayload),
      );
    } catch (error) {
      this.logger.error(
        `Task ${newTask._id.toString()} created but event publish failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return newTask;
  }


//   async getMyTasksGrouped(teamId: string) {
 

//   const tasks = await this.taskModel.find({
//     assignedTeams: { $in: teamId }
//   }).populate("status");

//   const grouped = {};

//   tasks.forEach(task => {
//     const stageName = task.status.; // backlog | in progress | done

//     if (!grouped[stageName]) {
//       grouped[stageName] = [];
//     }

//     grouped[stageName].push(task);
//   });

//   return grouped;
// }

  // async prevcreate(createTaskDto: CreateTaskDto, milestoneId: string) {
  //   const response = await this.milestoneModel.findById(milestoneId).exec();
  //   if (!response) {
  //     throw new Error(`Milestone with id ${milestoneId} not found`);
  //   }

  //   const newTask = await this.taskModel.create({
  //     ...createTaskDto,
  //     milestoneId,
  //   });

  //   await this.taskSTageModel
  //     .findByIdAndUpdate('69c0561d9fc8a9ce45f45bee', {
  //       $push: { tasks: newTask._id },
  //     })
  //     .exec();

  //   response.tasks.push(newTask._id);
  //   await response.save();
  //   return newTask;
  // }

  async findAll() {
    try {
      const response = await this.taskModel.find().exec();
      return response;
    } catch (error:any) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  /**
   * Tâches à afficher comme « urgentes » (priorité élevée ou échéance dépassée / proche).
   */
  async findUrgentForDashboard() {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);

    const tasks = await this.taskModel
      .find({
        $or: [
          {
            priority: {
              $in: [
                'critical',
                'high',
                'urgent',
                'Critical',
                'High',
                'Urgent',
                'CRITICAL',
                'HIGH',
                'URGENT',
              ],
            },
          },
          { endDate: { $lte: soon } },
        ],
      })
      .populate('status')
      .sort({ endDate: 1 })
      .limit(80)
      .lean()
      .exec();

    return tasks;
  }

  async findOne(id: string) {
    try {
      const response = await this.taskModel.findById(id).exec();
      return response;
    } catch (error:any) {
      throw new Error(`Error fetching task: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les tâches d'un projet pour le Gantt
   * Retourne les tâches avec leurs dates, progression et statut
   */
  async getTasksForGantt(projectId: string) {
    try {
      const tasks = await this.taskModel
        .find({ projectId })
        .populate('status')
        .populate('milestoneId')
        .lean()
        .exec();

      // Transformer les données pour le Gantt
      return tasks.map((task) => ({
        id: task._id,
        text: task.title,
        start: task.startDate || new Date(),
        end: task.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Par défaut 7 jours
        progress: task.progress || 0,
        parent: task.parent || 0, // 0 = pas de parent (tâche principale)
        open: true,
        type: task.type === 'summary' ? 'summary' : 'task',
        priority: task.priority,
        assignedTeams: task.assignedTeams,
        description: task.description,
        milestoneId: task.milestoneId,
        status: task.status,
      }));
    } catch (error:any) {
      throw new Error(`Error fetching tasks for Gantt: ${error.message}`);
    }
  }

  /**
   * Met à jour les dates d'une tâche (pour drag & drop dans le Gantt)
   */
  async updateTaskDates(taskId: string, startDate: Date, endDate: Date) {
    try {
      const response = await this.taskModel
        .findByIdAndUpdate(taskId, { startDate, endDate }, { new: true })
        .exec();

      if (!response) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      return response;
    } catch (error:any) {
      throw new Error(`Error updating task dates: ${error.message}`);
    }
  }
  async updateNew(taskId: string, taskStageId: string) {
    //const response= await this.taskModel.findByIdAndUpdate(taskId, {task})
    console.log(`Updating task ${taskId} to new stage ${taskStageId}`);
    const task = await this.taskModel.findByIdAndUpdate(taskId, {
      status: taskStageId,
    });
    const oldTaskSTage = await this.taskSTageModel.findByIdAndUpdate(
      task?.status,
      {
        $pull: {
          tasks: task?._id,
        },
      },
    );
    console.log(`Old task stage after pull: ${oldTaskSTage}`);

    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const res = await this.taskSTageModel.findByIdAndUpdate(taskStageId, {
      $push: { tasks: task._id },
    });
    console.log(res);
    return res;
  }
  async update(id: string, updateTaskDto: UpdateTaskDto) {
    try {
      const payload: UpdateTaskDto = { ...updateTaskDto };

      if (payload.assignedTeams !== undefined) {
        payload.assignedTeams = this.normalizeAssignedTeams(payload.assignedTeams);
      }

      const response = await this.taskModel
        .findByIdAndUpdate(id, payload, { new: true })
        .exec();
      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error: any) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  async getTaskByTeamid(teamId: string) {
    try {
      const response = await this.taskModel.find({ assignedTeams: { $in: [teamId] } }).exec();
      return response;
    } catch (error:any) {
      throw new Error(`Error fetching tasks for team ${teamId}: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      //const taskSTage= await this.taskSTageModel.findByIdAndUpdate()
      const response = await this.taskModel.findByIdAndDelete(id).exec();
      const taskSTage = await this.taskSTageModel.findByIdAndUpdate(
        response?.status,
        {
          $pull: {
            tasks: response?._id,
          },
        },
      );

      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error: any) {
      throw new Error(`Error removing task: ${error.message}`);
    }
  }
  getTAsksByTeamId = async (teamId: string) => {
    return await this.taskModel
      .find({ assignedTeams: { $in: [teamId] } })
      .exec();
  };
  async getMyTask(userId: string) {
    if (!userId) {
      return [];
    }
    // console.log(`Fetching tasks for user ${userId}`);

    return await this.taskModel
      .find({
        $or: [{ assignedTeams: userId }, { assignedTeams: { $in: [userId] } }],
      })
      .exec();
  }

  async getMyTasks(userId: string) {
    try {
      if (!userId) {
        return [];
      }

      // 1) Fetch all tasks assigned to the current user
      const tasks = await this.taskModel
        .find({
          $or: [
            { assignedTeams: userId },
            { assignedTeams: { $in: [userId] } },
          ],
        })
        .lean()
        .exec();

      if (!tasks.length) {
        return [];
      }

      // 2) Collect distinct status (TaskStage) ids from these tasks
      const statusIds = Array.from(
        new Set(
          tasks
            .map((task: any) => task.status)
            .filter((id) => !!id)
            .map((id) => id.toString()),
        ),
      );

      // 3) Load the corresponding TaskStages to get their name & color
      const stages = await this.taskSTageModel
        .find({ _id: { $in: statusIds } })
        .lean()
        .exec();

      const stageMap = new Map(
        stages.map((stage: any) => [stage._id.toString(), stage]),
      );

      // 4) Group tasks by status into columns
      const columnsMap = new Map<
        string,
        { id: string; title: string; color: string; tasks: any[] }
      >();

      tasks.forEach((task: any) => {
        const statusId = task.status ? task.status.toString() : 'no-status';

        if (!columnsMap.has(statusId)) {
          const stage = stageMap.get(statusId);
          columnsMap.set(statusId, {
            id: statusId,
            title: stage?.name || 'No status',
            color: stage?.color || getColorForStatus(statusId),
            tasks: [],
          });
        }

        columnsMap.get(statusId)!.tasks.push(task);
      });

      return Array.from(columnsMap.values());
    } catch (error: any) {
      throw new Error(`Error fetching tasks for user: ${error.message}`);
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
      const columns = response.map((group, i) => ({
        id: `${group.title}`, // or use uuid/v4 for random unique id
        title: group.title,
        color: getColorForStatus(group.status),
        tasks: group.tasks,
      }));

      return columns;
    } catch (error: any) {
      throw new Error(`Error fetching tasks by milestone id: ${error.message}`);
    }
  }
}

function getColorForStatus(status: string) {
  return 'primary';
}
