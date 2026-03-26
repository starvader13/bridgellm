import http from 'node:http';
import { saveToken, saveServerUrl, saveGlobalConfig, getGlobalConfig } from '../config.js';
import { heading, info, success, warn, ask, select, selectRole, summary } from '../ui.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function login(serverUrl: string): Promise<void> {
  const server = http.createServer();

  const port = await new Promise<number>((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          resolve(typeof addr === 'object' && addr ? addr.port : 0);
        });
      } else {
        reject(err);
      }
    });
    server.listen(9876, '127.0.0.1', () => {
      resolve(9876);
    });
  });

  const authUrl = `${serverUrl}/auth/github?cli_port=${port}`;

  heading('GitHub Authentication');
  info('Opening browser...');
  info(`If it doesn't open, visit:\n    ${authUrl}\n`);

  const open = (await import('open')).default;
  await open(authUrl);

  const result = await new Promise<{ token: string; name: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Login timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    server.on('request', (req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const name = url.searchParams.get('name');

        if (token) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html><body style="font-family: system-ui; padding: 2em; text-align: center;">
              <h2>Logged in as ${escapeHtml(name ?? 'unknown')}</h2>
              <p>You can close this tab and return to the terminal.</p>
            </body></html>
          `);
          clearTimeout(timeout);
          resolve({ token, name: name ?? 'unknown' });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Login failed</h2></body></html>');
          clearTimeout(timeout);
          reject(new Error('No token in callback'));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });

  server.close();

  await saveToken(result.token);
  await saveServerUrl(serverUrl);

  success(`Logged in as ${result.name}`);

  // Check if global config already has team + role
  const existing = await getGlobalConfig();
  if (existing.team && existing.role) {
    summary({ Team: existing.team, Role: existing.role });
    info('Run `bridgellm connect` in your project directory.\n');
    return;
  }

  // First-time setup
  heading('First-time setup');
  console.log('');

  // Team
  let teamName: string | undefined;
  const meRes = await fetch(`${serverUrl}/api/me`, {
    headers: { Authorization: `Bearer ${result.token}` },
  });
  const me = await meRes.json() as { team: { name: string } | null };

  if (me.team) {
    teamName = me.team.name;
    success(`Team: ${teamName}`);
  } else {
    const { value, isNew } = await select('No team yet', ['Create a new team', 'Join with invite code']);

    if (value === 'Create a new team') {
      const name = await ask('Team name: ');
      const res = await fetch(`${serverUrl}/api/teams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${result.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json() as { team: { name: string }; invite_code: string };
      teamName = data.team.name;
      success(`Created "${teamName}"`);
      info(`Invite code: ${data.invite_code}`);
      info('Share this code so teammates can join.\n');
    } else {
      const code = await ask('Invite code: ');
      const res = await fetch(`${serverUrl}/api/teams/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${result.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      });
      const data = await res.json() as { team: { name: string } };
      teamName = data.team.name;
      success(`Joined "${teamName}"`);
    }
  }

  // Role
  const role = await selectRole();

  await saveGlobalConfig({ team: teamName, role });

  summary({ Team: teamName!, Role: role });
  info('Run `bridgellm connect` in your project directory.\n');
}
