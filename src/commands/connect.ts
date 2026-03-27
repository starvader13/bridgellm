import { ask, select } from '../ui.js';

export async function selectFeature(
  serverUrl: string,
  token: string,
  defaultFeature?: string,
): Promise<string> {
  let feature: string;

  try {
    const res = await fetch(`${serverUrl}/api/features`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to fetch features');

    const { features } = (await res.json()) as {
      features: Array<{
        name: string;
        context_count: number;
        active_sessions: number;
      }>;
    };

    if (features.length > 0) {
      const labels = features.map(
        (f) => `${f.name} (${f.context_count} contexts, ${f.active_sessions} online)`,
      );
      const defaultIdx = defaultFeature
        ? Math.max(0, features.findIndex((f) => f.name === defaultFeature))
        : 0;

      const result = await select('Select feature', labels, {
        newLabel: 'Create new feature',
        defaultIndex: defaultIdx,
      });

      if (result.isNew) {
        feature = await ask('Feature name: ');
      } else {
        feature = result.value;
      }
    } else {
      feature = await ask('No features yet. Feature name: ');
    }
  } catch {
    feature = await ask('Feature name: ');
  }

  if (!feature) throw new Error('Feature name is required.');

  return feature;
}
