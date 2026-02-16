import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  todoId: string;
  tenantId: string;
  userId: string; // User this todo is assigned to
  description: string;
  projectId?: string; // Optional: link to project
  eventId?: string; // Optional: link to event
  dueDate?: Date;
  redirectUrl?: string; // Where to redirect when clicking the todo
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  addedBy: string; // userId of person who created the todo
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    todoId: {
      type: String,
      required: true,
      unique: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    eventId: {
      type: String,
      index: true,
    },
    dueDate: {
      type: Date,
    },
    redirectUrl: {
      type: String,
      trim: true,
    },
    isDone: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    addedBy: {
      type: String,
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
todoSchema.index({ tenantId: 1, userId: 1, isDone: 1 });
todoSchema.index({ tenantId: 1, userId: 1, dueDate: 1 });
todoSchema.index({ tenantId: 1, projectId: 1 });
todoSchema.index({ tenantId: 1, eventId: 1 });

// Pre-save hook to set completedAt when isDone is set to true
todoSchema.pre('save', function (next) {
  if (this.isModified('isDone') && this.isDone && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Todo = mongoose.model<ITodo>('Todo', todoSchema);

export default Todo;
