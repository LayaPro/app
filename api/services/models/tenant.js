const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, index: true },
  tenantName: { type: String, required: true, trim: true },
  tenantUsername: { type: String, required: true, trim: true, unique: true },
  isInternal: { type: Boolean, default: false },
  addedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', TenantSchema);
