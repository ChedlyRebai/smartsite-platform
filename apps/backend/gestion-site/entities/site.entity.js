"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSchema = exports.Site = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var mongoose_2 = require("mongoose");
var Site = function () {
    var _classDecorators = [(0, mongoose_1.Schema)({ timestamps: true, collection: 'sites' })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = mongoose_2.Document;
    var _nom_decorators;
    var _nom_initializers = [];
    var _nom_extraInitializers = [];
    var _adresse_decorators;
    var _adresse_initializers = [];
    var _adresse_extraInitializers = [];
    var _localisation_decorators;
    var _localisation_initializers = [];
    var _localisation_extraInitializers = [];
    var _budget_decorators;
    var _budget_initializers = [];
    var _budget_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _isActif_decorators;
    var _isActif_initializers = [];
    var _isActif_extraInitializers = [];
    var _area_decorators;
    var _area_initializers = [];
    var _area_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _progress_decorators;
    var _progress_initializers = [];
    var _progress_extraInitializers = [];
    var _workStartDate_decorators;
    var _workStartDate_initializers = [];
    var _workStartDate_extraInitializers = [];
    var _workEndDate_decorators;
    var _workEndDate_initializers = [];
    var _workEndDate_extraInitializers = [];
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _coordinates_decorators;
    var _coordinates_initializers = [];
    var _coordinates_extraInitializers = [];
    var _createdBy_decorators;
    var _createdBy_initializers = [];
    var _createdBy_extraInitializers = [];
    var _updatedBy_decorators;
    var _updatedBy_initializers = [];
    var _updatedBy_extraInitializers = [];
    var _teams_decorators;
    var _teams_initializers = [];
    var _teams_extraInitializers = [];
    var _teamIds_decorators;
    var _teamIds_initializers = [];
    var _teamIds_extraInitializers = [];
    var Site = _classThis = /** @class */ (function (_super) {
        __extends(Site_1, _super);
        function Site_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.nom = __runInitializers(_this, _nom_initializers, void 0);
            _this.adresse = (__runInitializers(_this, _nom_extraInitializers), __runInitializers(_this, _adresse_initializers, void 0));
            _this.localisation = (__runInitializers(_this, _adresse_extraInitializers), __runInitializers(_this, _localisation_initializers, void 0));
            _this.budget = (__runInitializers(_this, _localisation_extraInitializers), __runInitializers(_this, _budget_initializers, void 0));
            _this.description = (__runInitializers(_this, _budget_extraInitializers), __runInitializers(_this, _description_initializers, void 0));
            _this.isActif = (__runInitializers(_this, _description_extraInitializers), __runInitializers(_this, _isActif_initializers, void 0));
            // Frontend fields
            _this.area = (__runInitializers(_this, _isActif_extraInitializers), __runInitializers(_this, _area_initializers, void 0));
            _this.status = (__runInitializers(_this, _area_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.progress = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _progress_initializers, void 0));
            _this.workStartDate = (__runInitializers(_this, _progress_extraInitializers), __runInitializers(_this, _workStartDate_initializers, void 0));
            _this.workEndDate = (__runInitializers(_this, _workStartDate_extraInitializers), __runInitializers(_this, _workEndDate_initializers, void 0));
            _this.projectId = (__runInitializers(_this, _workEndDate_extraInitializers), __runInitializers(_this, _projectId_initializers, void 0));
            _this.coordinates = (__runInitializers(_this, _projectId_extraInitializers), __runInitializers(_this, _coordinates_initializers, void 0));
            _this.createdBy = (__runInitializers(_this, _coordinates_extraInitializers), __runInitializers(_this, _createdBy_initializers, void 0));
            _this.updatedBy = (__runInitializers(_this, _createdBy_extraInitializers), __runInitializers(_this, _updatedBy_initializers, void 0));
            // Team assignment fields
            // References to individual users (foremen/workers) - uses UserSimple
            _this.teams = (__runInitializers(_this, _updatedBy_extraInitializers), __runInitializers(_this, _teams_initializers, void 0));
            // References to MongoDB Teams (team documents)
            _this.teamIds = (__runInitializers(_this, _teams_extraInitializers), __runInitializers(_this, _teamIds_initializers, void 0));
            __runInitializers(_this, _teamIds_extraInitializers);
            return _this;
        }
        Object.defineProperty(Site_1.prototype, "formattedBudget", {
            // Virtual for formatted budget
            get: function () {
                return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                }).format(this.budget);
            },
            enumerable: false,
            configurable: true
        });
        return Site_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Site");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _nom_decorators = [(0, mongoose_1.Prop)({ required: true, trim: true, index: true })];
        _adresse_decorators = [(0, mongoose_1.Prop)({ required: true, trim: true })];
        _localisation_decorators = [(0, mongoose_1.Prop)({ required: true, trim: true, index: true })];
        _budget_decorators = [(0, mongoose_1.Prop)({ required: true, type: Number, min: 0 })];
        _description_decorators = [(0, mongoose_1.Prop)({ trim: true })];
        _isActif_decorators = [(0, mongoose_1.Prop)({ default: true, index: true })];
        _area_decorators = [(0, mongoose_1.Prop)({ type: Number, default: 0 })];
        _status_decorators = [(0, mongoose_1.Prop)({ type: String, enum: ['planning', 'in_progress', 'on_hold', 'completed'], default: 'planning' })];
        _progress_decorators = [(0, mongoose_1.Prop)({ type: Number, default: 0 })];
        _workStartDate_decorators = [(0, mongoose_1.Prop)({ type: Date })];
        _workEndDate_decorators = [(0, mongoose_1.Prop)({ type: Date })];
        _projectId_decorators = [(0, mongoose_1.Prop)({ type: String })];
        _coordinates_decorators = [(0, mongoose_1.Prop)({ type: Object })];
        _createdBy_decorators = [(0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null })];
        _updatedBy_decorators = [(0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null })];
        _teams_decorators = [(0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'UserSimple' }], default: [] })];
        _teamIds_decorators = [(0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Team' }], default: [] })];
        __esDecorate(null, null, _nom_decorators, { kind: "field", name: "nom", static: false, private: false, access: { has: function (obj) { return "nom" in obj; }, get: function (obj) { return obj.nom; }, set: function (obj, value) { obj.nom = value; } }, metadata: _metadata }, _nom_initializers, _nom_extraInitializers);
        __esDecorate(null, null, _adresse_decorators, { kind: "field", name: "adresse", static: false, private: false, access: { has: function (obj) { return "adresse" in obj; }, get: function (obj) { return obj.adresse; }, set: function (obj, value) { obj.adresse = value; } }, metadata: _metadata }, _adresse_initializers, _adresse_extraInitializers);
        __esDecorate(null, null, _localisation_decorators, { kind: "field", name: "localisation", static: false, private: false, access: { has: function (obj) { return "localisation" in obj; }, get: function (obj) { return obj.localisation; }, set: function (obj, value) { obj.localisation = value; } }, metadata: _metadata }, _localisation_initializers, _localisation_extraInitializers);
        __esDecorate(null, null, _budget_decorators, { kind: "field", name: "budget", static: false, private: false, access: { has: function (obj) { return "budget" in obj; }, get: function (obj) { return obj.budget; }, set: function (obj, value) { obj.budget = value; } }, metadata: _metadata }, _budget_initializers, _budget_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _isActif_decorators, { kind: "field", name: "isActif", static: false, private: false, access: { has: function (obj) { return "isActif" in obj; }, get: function (obj) { return obj.isActif; }, set: function (obj, value) { obj.isActif = value; } }, metadata: _metadata }, _isActif_initializers, _isActif_extraInitializers);
        __esDecorate(null, null, _area_decorators, { kind: "field", name: "area", static: false, private: false, access: { has: function (obj) { return "area" in obj; }, get: function (obj) { return obj.area; }, set: function (obj, value) { obj.area = value; } }, metadata: _metadata }, _area_initializers, _area_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _progress_decorators, { kind: "field", name: "progress", static: false, private: false, access: { has: function (obj) { return "progress" in obj; }, get: function (obj) { return obj.progress; }, set: function (obj, value) { obj.progress = value; } }, metadata: _metadata }, _progress_initializers, _progress_extraInitializers);
        __esDecorate(null, null, _workStartDate_decorators, { kind: "field", name: "workStartDate", static: false, private: false, access: { has: function (obj) { return "workStartDate" in obj; }, get: function (obj) { return obj.workStartDate; }, set: function (obj, value) { obj.workStartDate = value; } }, metadata: _metadata }, _workStartDate_initializers, _workStartDate_extraInitializers);
        __esDecorate(null, null, _workEndDate_decorators, { kind: "field", name: "workEndDate", static: false, private: false, access: { has: function (obj) { return "workEndDate" in obj; }, get: function (obj) { return obj.workEndDate; }, set: function (obj, value) { obj.workEndDate = value; } }, metadata: _metadata }, _workEndDate_initializers, _workEndDate_extraInitializers);
        __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
        __esDecorate(null, null, _coordinates_decorators, { kind: "field", name: "coordinates", static: false, private: false, access: { has: function (obj) { return "coordinates" in obj; }, get: function (obj) { return obj.coordinates; }, set: function (obj, value) { obj.coordinates = value; } }, metadata: _metadata }, _coordinates_initializers, _coordinates_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: function (obj) { return "createdBy" in obj; }, get: function (obj) { return obj.createdBy; }, set: function (obj, value) { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _updatedBy_decorators, { kind: "field", name: "updatedBy", static: false, private: false, access: { has: function (obj) { return "updatedBy" in obj; }, get: function (obj) { return obj.updatedBy; }, set: function (obj, value) { obj.updatedBy = value; } }, metadata: _metadata }, _updatedBy_initializers, _updatedBy_extraInitializers);
        __esDecorate(null, null, _teams_decorators, { kind: "field", name: "teams", static: false, private: false, access: { has: function (obj) { return "teams" in obj; }, get: function (obj) { return obj.teams; }, set: function (obj, value) { obj.teams = value; } }, metadata: _metadata }, _teams_initializers, _teams_extraInitializers);
        __esDecorate(null, null, _teamIds_decorators, { kind: "field", name: "teamIds", static: false, private: false, access: { has: function (obj) { return "teamIds" in obj; }, get: function (obj) { return obj.teamIds; }, set: function (obj, value) { obj.teamIds = value; } }, metadata: _metadata }, _teamIds_initializers, _teamIds_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Site = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Site = _classThis;
}();
exports.Site = Site;
exports.SiteSchema = mongoose_1.SchemaFactory.createForClass(Site);
// Add virtuals to JSON - use any type to avoid TypeScript issues
exports.SiteSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        // Rename _id to id
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
exports.SiteSchema.set('toObject', {
    virtuals: true,
    transform: function (_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
