import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FeaturesRoute');
const router = Router();

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  releaseDate: string;
  enabled: boolean;
}

// Features can be configured via env vars: FEATURE_<ID>=true|false
// Static features are always available
const STATIC_FEATURES: FeatureDefinition[] = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enable dark mode for better night viewing',
    releaseDate: '2024-03-15',
    enabled: true,
  },
  {
    id: 'tab-management',
    name: 'Tab Management',
    description: 'Customize your tab layout in settings',
    releaseDate: '2024-03-20',
    enabled: true,
  },
  {
    id: 'context-optimization',
    name: 'Context Optimization',
    description: 'Reduce token usage by optimizing context',
    releaseDate: '2024-06-01',
    enabled: true,
  },
  {
    id: 'design-scheme',
    name: 'Design Scheme',
    description: 'Customize the visual design scheme of generated projects',
    releaseDate: '2024-08-01',
    enabled: true,
  },
  {
    id: 'mcp-tools',
    name: 'MCP Tools',
    description: 'Use Model Context Protocol servers for enhanced AI capabilities',
    releaseDate: '2024-09-01',
    enabled: true,
  },
  {
    id: 'speech-input',
    name: 'Speech Input',
    description: 'Use voice input for chat messages',
    releaseDate: '2024-10-01',
    enabled: true,
  },
  {
    id: 'experimental-multimodal',
    name: 'Experimental: Multimodal Input',
    description: 'Upload and analyze images in chat',
    releaseDate: '2024-11-01',
    enabled: false,
  },
];

function getConfiguredFeatures(): FeatureDefinition[] {
  return STATIC_FEATURES.map((feature) => {
    const envKey = `FEATURE_${feature.id.toUpperCase().replace(/-/g, '_')}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      return {
        ...feature,
        enabled: envValue === 'true' || envValue === '1',
      };
    }

    return feature;
  });
}

// GET /api/features - list all features
router.get('/', (_req: Request, res: Response) => {
  try {
    const features = getConfiguredFeatures();
    res.json({ features });
  } catch (error: any) {
    logger.error('Features error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/features/viewed - acknowledge a feature as viewed
router.post('/viewed', (req: Request, res: Response) => {
  try {
    const { featureId } = req.body;

    if (!featureId) {
      res.status(400).json({ error: 'featureId is required' });
      return;
    }

    logger.debug(`Feature ${featureId} marked as viewed`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Feature viewed error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
