import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from 'src/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<Notification>,
  ) {}

  async getAllNotifications() {
    return await this.notifModel.find().exec();
  }

  async getAllNotificationsPaginated(page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getNotificationsByRecipientId(recipientId: string) {
    return await this.notifModel.find({ recipentId: recipientId }).exec();
  }

  async getNotificationsByRecipientIdPaginated(
    recipientId: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find({ recipentId: recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getNotiFicationByUserId(userId: string) {
    return await this.getNotificationsByRecipientId(userId);
  }

  async getNotificationsByTeamId(teamId: string) {
    return await this.getNotificationsByRecipientId(teamId);
  }

  async createNotification(notification: Partial<Notification>) {
    const newNotification = new this.notifModel(notification);
    return await newNotification.save();
  }

  async markAsRead(notificationId: string) {
    return await this.notifModel.findByIdAndUpdate(notificationId, {
      isRead: true,
    });
  }

  async markAllAsReadByRecipientId(recipientId: string) {
    return await this.notifModel.updateMany(
      { recipentId: recipientId, isRead: false },
      { $set: { isRead: true } },
    ).exec();
  }

  async deleteNotificationById(notificationId: string) {
    return await this.notifModel.findByIdAndDelete(notificationId);
  }

  async getUnreadNotificationsByUserId(userId: string) {
    return await this.notifModel
      .find({ recipentId: userId, isRead: false })
      .exec();
  }

  async getUnreadNotificationsByUserIdPaginated(
    userId: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find({ recipentId: userId, isRead: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getUnreadNotificationsByTeamId(teamId: string) {
    return await this.notifModel
      .find({ recipentId: teamId, isRead: false })
      .exec();
  }

  async getUnreadNotificationsByTeamIdPaginated(
    teamId: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find({ recipentId: teamId, isRead: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getReadNotificationsByUserId(userId: string) {
    return await this.notifModel
      .find({ recipentId: userId, isRead: true })
      .exec();
  }

  async getReadNotificationsByUserIdPaginated(
    userId: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find({ recipentId: userId, isRead: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getReadNotificationsByTeamId(teamId: string) {
    return await this.notifModel
      .find({ recipentId: teamId, isRead: true })
      .exec();
  }

  async getReadNotificationsByTeamIdPaginated(
    teamId: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    return await this.notifModel
      .find({ recipentId: teamId, isRead: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();
  }

  async getUnreadNotificationLengthByserId(userId: string) {
    return await this.notifModel
      .countDocuments({ recipentId: userId, isRead: false })
      .exec();
  }

  async getUnreadNotificationLengthByTeamId(teamId: string) {
    return await this.notifModel
      .countDocuments({ recipentId: teamId, isRead: false })
      .exec();
  }

  async markAllAsReadByTeamId(teamId: string) {
    return await this.markAllAsReadByRecipientId(teamId);
  }
}
