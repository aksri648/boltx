import { Router, type Request, type Response, type NextFunction } from 'express';
import { Chat } from '~/lib/models/Chat';
import { isMongoDBConnected } from '~/lib/db/mongodb';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatRoutes');
const router = Router();

// Middleware to check MongoDB availability
function requireDB(req: Request, res: Response, next: NextFunction) {
  if (!isMongoDBConnected()) {
    res.status(503).json({ error: 'MongoDB not configured. Set MONGODB_URI environment variable.' });
    return;
  }
  next();
}

router.use(requireDB);

// List all chats (sorted by most recently updated)
// Includes a lastMessage preview for sidebar display without loading full message history
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Use aggregate to get only the last message per chat without fetching all messages
    const chats = await Chat.aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          chatId: 1,
          title: 1,
          updatedAt: 1,
          lastMessage: {
            $let: {
              vars: { last: { $last: '$messages' } },
              in: {
                $cond: {
                  if: { $ne: ['$$last', undefined] },
                  then: {
                    role: '$$last.role',
                    content: { $substrCP: ['$$last.content', 0, 120] },
                  },
                  else: null,
                },
              },
            },
          },
        },
      },
    ]);

    const result = chats.map((chat: any) => ({
      chatId: chat.chatId,
      title: chat.title,
      updatedAt: chat.updatedAt,
      lastMessage: chat.lastMessage,
    }));

    res.json(result);
  } catch (error: any) {
    logger.error('Failed to list chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single chat by chatId
router.get('/:chatId', async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findOne({ chatId: req.params.chatId }).lean();

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.json(chat);
  } catch (error: any) {
    logger.error('Failed to get chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update a chat (upsert by chatId)
router.put('/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { title, messages, systemPrompt, metadata } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { chatId },
      {
        chatId,
        ...(title !== undefined && { title }),
        ...(messages !== undefined && { messages }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(metadata !== undefined && { metadata }),
      },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    res.json(chat);
  } catch (error: any) {
    logger.error('Failed to save chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat
router.delete('/:chatId', async (req: Request, res: Response) => {
  try {
    const result = await Chat.deleteOne({ chatId: req.params.chatId });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Max messages per chat to prevent unbounded array growth
const MAX_MESSAGES_PER_CHAT = 1000;

// Append messages to an existing chat (context window persistence)
router.post('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages must be a non-empty array' });
      return;
    }

    // First trim old messages if the chat exceeds the limit
    const chat = await Chat.findOne({ chatId }).select('messages').lean();
    if (chat && chat.messages.length + messages.length > MAX_MESSAGES_PER_CHAT) {
      await Chat.updateOne(
        { chatId },
        { $push: { messages: { $each: [], $slice: -MAX_MESSAGES_PER_CHAT } } },
      );
    }

    const updated = await Chat.findOneAndUpdate(
      { chatId },
      { $push: { messages: { $each: messages } } },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    res.json(updated);
  } catch (error: any) {
    logger.error('Failed to append messages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
