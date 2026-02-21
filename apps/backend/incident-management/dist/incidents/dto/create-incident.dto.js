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
exports.CreateIncidentDto = void 0;
const class_validator_1 = require("class-validator");
const incident_entity_1 = require("../entities/incident.entity");
class CreateIncidentDto {
    type;
    degree;
    title;
    description;
    reportedBy;
    siteId;
    projectId;
    location;
    reporterName;
    reporterPhone;
    affectedPersons;
    immediateAction;
    status;
}
exports.CreateIncidentDto = CreateIncidentDto;
__decorate([
    (0, class_validator_1.IsEnum)(incident_entity_1.IncidentType),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(incident_entity_1.IncidentDegree),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "reportedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "projectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "reporterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "reporterPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "affectedPersons", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "immediateAction", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["open", "in_progress", "resolved", "closed"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "status", void 0);
//# sourceMappingURL=create-incident.dto.js.map