"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIncidentDto = void 0;
const class_validator_1 = require("class-validator");
const incident_entity_1 = require("../entities/incident.entity");
class UpdateIncidentDto {
    type;
    degree;
    title;
    description;
    reportedBy;
    siteId;
    projectId;
    location;
    status;
    resolutionNotes;
    resolvedBy;
}
exports.UpdateIncidentDto = UpdateIncidentDto;
__decorate([
    (0, class_validator_1.IsEnum)(incident_entity_1.IncidentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(incident_entity_1.IncidentDegree),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "reportedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "projectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["open", "in_progress", "resolved", "closed"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIncidentDto.prototype, "resolvedBy", void 0);
//# sourceMappingURL=update-incident.dto.js.map