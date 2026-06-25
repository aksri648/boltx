import mongoose, { Schema, type Document } from 'mongoose';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface IChat extends Document {
  chatId: string;
  title: string;
  messages: IMessage[];
  systemPrompt?: string;    metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Number },
  },
  { _id: false },
);

const ChatSchema = new Schema<IChat>(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: { type: [MessageSchema], default: [] },
    systemPrompt: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ChatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
