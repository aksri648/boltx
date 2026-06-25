export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
  enabled: boolean;
}

export const getFeatureFlags = async (): Promise<Feature[]> => {
  try {
    const response = await fetch('/api/features');

    if (!response.ok) {
      console.error('Failed to fetch features, using defaults');
      return getDefaultFeatures();
    }

    const data = (await response.json()) as { features: Feature[] };
    const features = data.features || [];

    // Mark already-viewed features based on localStorage
    const viewedFeatures = getViewedFeatureIds();

    return features.map((feature) => ({
      ...feature,
      viewed: viewedFeatures.includes(feature.id),
    }));
  } catch (error) {
    console.error('Error fetching features:', error);
    return getDefaultFeatures();
  }
};

const getViewedFeatureIds = (): string[] => {
  try {
    const stored = localStorage.getItem('bolt_viewed_features');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

function getDefaultFeatures(): Feature[] {
  return [
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      description: 'Enable dark mode for better night viewing',
      viewed: true,
      releaseDate: '2024-03-15',
      enabled: true,
    },
    {
      id: 'tab-management',
      name: 'Tab Management',
      description: 'Customize your tab layout in settings',
      viewed: true,
      releaseDate: '2024-03-20',
      enabled: true,
    },
    {
      id: 'context-optimization',
      name: 'Context Optimization',
      description: 'Reduce token usage by optimizing context',
      viewed: false,
      releaseDate: '2024-06-01',
      enabled: true,
    },
    {
      id: 'design-scheme',
      name: 'Design Scheme',
      description: 'Customize the visual design scheme of generated projects',
      viewed: false,
      releaseDate: '2024-08-01',
      enabled: true,
    },
    {
      id: 'mcp-tools',
      name: 'MCP Tools',
      description: 'Use Model Context Protocol servers for enhanced AI capabilities',
      viewed: false,
      releaseDate: '2024-09-01',
      enabled: true,
    },
    {
      id: 'speech-input',
      name: 'Speech Input',
      description: 'Use voice input for chat messages',
      viewed: false,
      releaseDate: '2024-10-01',
      enabled: true,
    },
  ];
}

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  try {
    const response = await fetch('/api/features/viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId }),
    });

    if (!response.ok) {
      console.warn(`Failed to mark feature ${featureId} as viewed on server`);
    }
  } catch (error) {
    console.warn(`Error marking feature ${featureId} as viewed:`, error);
  }
};
