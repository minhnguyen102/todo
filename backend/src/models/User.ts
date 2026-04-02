import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  first_name?: string;
  last_name?: string;
  username: string;
  password?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    first_name: {
      type: String,
      required: false,
      trim: true,
    },
    last_name: {
      type: String,
      required: false,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export default mongoose.model<IUser>('User', UserSchema);
