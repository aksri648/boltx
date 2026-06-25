import { Router, type Request, type Response, type NextFunction } from 'express';
import { Chat, type IChat } from '~/lib/models/Chat';
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
    const chats = await Chat.find()
      .select('chatId title messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const result = chats.map((chat: any) => {
      const msgs = chat.messages || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

      return {
        chatId: chat.chatId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        lastMessage: lastMsg
          ? {
              role: lastMsg.role,
              content: lastMsg.content.slice(0, 120),
            }
          : null,
      };
    });

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

// Append messages to an existing chat (context window persistence)
router.post('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages must be a non-empty array' });
      return;
    }

    const chat = await Chat.findOneAndUpdate(
      { chatId },
      { $push: { messages: { $each: messages } } },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    res.json(chat);
  } catch (error: any) {
    logger.error('Failed to append messages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
