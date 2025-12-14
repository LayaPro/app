const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
