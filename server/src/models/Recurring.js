import mongoose from 'mongoose';

const recurringSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastGenerated: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

recurringSchema.index({ user: 1, active: 1 });

const Recurring = mongoose.model('Recurring', recurringSchema);
export default Recurring;
