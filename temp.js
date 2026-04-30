const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'apps/backend/materials-service/src/materials/services/material-flow.service.ts');
let content = fs.readFileSync(filePath, 'utf8');
if (content.includes('getAggregateStats')) { console.log('Already modified'); process.exit(0); }
const methods = `
  async getAggregateStats(materialId: string, siteId?: string): Promise<{ totalEntries: number; totalExits: number; netFlow: number; totalAnomalies: number; lastMovement: Date | null; breakdownByType: Array<{ _id: FlowType; totalQuantity: number; count: number }>; }> {
    const filter: any = { materialId: new Types.ObjectId(materialId) };
    if (siteId) { filter.siteId = new Types.ObjectId(siteId); }
    const aggregation = await this.flowLogModel.aggregate([
      { $match: filter },
      { $group: { _id: '$type', totalQuantity: { $sum: '$quantity' }, count: { $sum: 1 } } },
      { $sort: { totalQuantity: -1 } },
    ]);
    const totalEntries = aggregation.filter((a:any) => a._id === FlowType.IN || a._id === FlowType.RETURN).reduce((s,a) => s + a.totalQuantity, 0);
    const totalExits = aggregation.filter((a:any) => a._id === FlowType.OUT || a._id === FlowType.DAMAGE || a._id === FlowType.ADJUSTMENT).reduce((s,a) => s + a.totalQuantity, 0);
    const totalAnomalies = await this.flowLogModel.countDocuments({ ...filter, anomalyDetected: { $ne: AnomalyType.NONE } });
    const lastDoc = await this.flowLogModel.find(filter).sort({ timestamp: -1 }).limit(1).select('timestamp').exec();
    return { totalEntries, totalExits, netFlow: totalEntries - totalExits, totalAnomalies, lastMovement: lastDoc[0]?.timestamp || null, breakdownByType: aggregation };
  }

  async getEnrichedFlows(query: MaterialFlowQueryDto): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.siteId) filter.siteId = new Types.ObjectId(query.siteId);
    if (query.materialId) filter.materialId = new Types.ObjectId(query.materialId);
    if (query.type) filter.type = query.type;
    if (query.anomalyDetected && query.anomalyDetected !== AnomalyType.NONE) filter.anomalyDetected = query.anomalyDetected;
    if (query.startDate || query.endDate) { filter.timestamp = {}; if (query.startDate) filter.timestamp.$gte = query.startDate; if (query.endDate) filter.timestamp.$lte = query.endDate; }
    const skip = ((query.page || 1) - 1) * (query.limit || 50);
    const [data, total] = await Promise.all([
      this.flowLogModel.find(filter).populate('materialId', 'name code category').populate('siteId', 'nom name').populate('userId', 'firstName lastName email').sort({ timestamp: -1 }).skip(skip).limit(query.limit || 50).exec(),
      this.flowLogModel.countDocuments(filter)
    ]);
    const enrichedData = data.map((flow:any) => ({
      ...flow.toObject(),
      materialName: flow.materialId?.name || 'Unknown',
      materialCode: flow.materialId?.code || 'N/A',
      materialCategory: flow.materialId?.category || 'N/A',
      siteName: flow.siteId?.nom || flow.siteId?.name || 'Unknown Site',
      userName: flow.userId?.firstName && flow.userId?.lastName ? `${flow.userId.firstName} ${flow.userId.lastName}` : flow.userId?.email || 'System',
    }));
    return { data: enrichedData, total };
  }
`;
const pos = content.lastIndexOf('\n}');
if (pos === -1) { console.error('Cannot find closing brace'); process.exit(1); }
content = content.slice(0, pos) + methods + '\n' + content.slice(pos);
fs.writeFileSync(filePath, content);
console.log('✅ Modified successfully');