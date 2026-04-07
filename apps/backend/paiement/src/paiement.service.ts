import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaiementService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {}

  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  async create(createPaymentDto: CreatePaymentDto, userId?: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(createPaymentDto.siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const reference = createPaymentDto.reference || this.generateReference();

    const paymentDate = new Date();

    let status = createPaymentDto.status || 'pending';
    if (status === 'paid') {
      status = 'completed';
    }

    const createdPayment = new this.paymentModel({
      siteId: new Types.ObjectId(createPaymentDto.siteId),
      reference,
      amount: createPaymentDto.amount,
      paymentMethod: createPaymentDto.paymentMethod,
      description: createPaymentDto.description,
      paymentDate,
      status,
      siteBudget: 0,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
    });

    return createdPayment.save();
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentModel.findById(id).exec();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findBySite(siteId: string): Promise<Payment[]> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    return this.paymentModel
      .find({ siteId: new Types.ObjectId(siteId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId?: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const updateData: any = {
      ...updatePaymentDto,
      updatedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
    };

    if (updatePaymentDto.siteId && !Types.ObjectId.isValid(updatePaymentDto.siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    if (updatePaymentDto.siteId) {
      updateData.siteId = new Types.ObjectId(updatePaymentDto.siteId);
    }

    if (updatePaymentDto.status === 'paid') {
      updateData.status = 'completed';
    }

    const payment = await this.paymentModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const result = await this.paymentModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }

  /**
   * Returns payment status for a site including total paid amount.
   * Used to prevent double-charging and show remaining budget.
   */
  async getPaymentStatus(siteId: string, siteBudget: number = 0): Promise<{
    hasPaid: boolean;
    totalPaid: number;
    remaining: number;
  }> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const payments = await this.paymentModel.find({
      siteId: new Types.ObjectId(siteId),
      status: { $in: ['completed', 'paid'] },
    });

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, siteBudget - totalPaid);

    return {
      hasPaid: payments.length > 0,
      totalPaid,
      remaining,
    };
  }

  async getTotalPaymentsBySite(siteId: string): Promise<number> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const result = await this.paymentModel.aggregate([
      { $match: { siteId: new Types.ObjectId(siteId), status: { $in: ['completed', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}
