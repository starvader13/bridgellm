import { getToken, getServerUrl, getGlobalConfig, saveGlobalConfig } from '../config.js';

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
    console.error(`Error: ${(data as { error: string }).error}`);
    process.exit(1);
  }

  const result = data as { team: { name: string }; invite_code: string };

  // Update global config
  const global = await getGlobalConfig();
  await saveGlobalConfig({ ...global, team: result.team.name });

  console.log(`Team "${result.team.name}" created!`);
  console.log(`Invite code: ${result.invite_code}`);
  console.log(`Share this code so others can join: bridgellm team join ${result.invite_code}`);
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
    console.error(`Error: ${(data as { error: string }).error}`);
    process.exit(1);
  }

  const result = data as { team: { name: string }; message: string };

  // Update global config
  const global = await getGlobalConfig();
  await saveGlobalConfig({ ...global, team: result.team.name });

  console.log(result.message);
}
