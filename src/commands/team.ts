import { getToken, getServerUrl, getGlobalConfig, saveGlobalConfig } from '../config.js';
import { success, info } from '../ui.js';

export async function createTeam(name: string): Promise<void> {
  const token = await getToken();
  const serverUrl = await getServerUrl();

  const res = await fetch(`${serverUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error: string }).error);
  }

  const result = data as { team: { name: string }; invite_code: string };

  const global = await getGlobalConfig();
  await saveGlobalConfig({ ...global, team: result.team.name });

  success(`Team "${result.team.name}" created`);
  info(`Invite code: ${result.invite_code}`);
  info('Share this code so teammates can join.');
}

export async function joinTeam(inviteCode: string): Promise<void> {
  const token = await getToken();
  const serverUrl = await getServerUrl();

  const res = await fetch(`${serverUrl}/api/teams/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invite_code: inviteCode }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error: string }).error);
  }

  const result = data as { team: { name: string }; message: string };

  const global = await getGlobalConfig();
  await saveGlobalConfig({ ...global, team: result.team.name });

  success(`Joined "${result.team.name}"`);
}
