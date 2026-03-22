#!/usr/bin/env node

import { Command } from 'commander';
import { login } from './commands/login.js';
import { connect } from './commands/connect.js';
import { createTeam, joinTeam } from './commands/team.js';
import { getGlobalConfig, saveGlobalConfig, getServerUrl, DEFAULT_SERVER, clean, reset } from './config.js';

const program = new Command();

program
  .name('bridgellm')
  .description('BridgeLLM — let AI coding agents talk to each other')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with GitHub OAuth')
  .option('-s, --server <url>', 'Server URL', DEFAULT_SERVER)
  .action(async (opts: { server: string }) => {
    try {
      await login(opts.server);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command('connect')
  .description('Connect this project to BridgeLLM')
  .action(async () => {
    try {
      await connect(process.cwd());
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

const team = program
  .command('team')
  .description('Team management');

team
  .command('create <name>')
  .description('Create a new team')
  .action(async (name: string) => {
    try {
      await createTeam(name);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

team
  .command('join <invite-code>')
  .description('Join a team via invite code')
  .action(async (inviteCode: string) => {
    try {
      await joinTeam(inviteCode);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

const config = program
  .command('config')
  .description('View or update settings');

config
  .command('show')
  .description('Show current config')
  .action(async () => {
    try {
      const global = await getGlobalConfig();
      const server = await getServerUrl();
      console.log(`  Server: ${server}`);
      console.log(`  Team:   ${global.team ?? '(not set)'}`);
      console.log(`  Role:   ${global.role ?? '(not set)'}`);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

config
  .command('set <key> <value>')
  .description('Set a config value (team, role)')
  .action(async (key: string, value: string) => {
    try {
      const global = await getGlobalConfig();
      if (key === 'team') {
        await saveGlobalConfig({ ...global, team: value });
        console.log(`  Team set to: ${value}`);
      } else if (key === 'role') {
        const ROLES = ['backend', 'frontend', 'web', 'mobile', 'ios', 'android', 'infra', 'data', 'qa', 'design'];
        const normalized = value.toLowerCase().trim();
        if (!ROLES.includes(normalized)) {
          console.error(`  Invalid role "${value}". Must be one of: ${ROLES.join(', ')}`);
          process.exit(1);
        }
        await saveGlobalConfig({ ...global, role: normalized });
        console.log(`  Role set to: ${normalized}`);
      } else {
        console.error(`  Unknown key: ${key}. Use "team" or "role".`);
        process.exit(1);
      }
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove local project config (.mcp.json, .bridgellm.yml, CLAUDE.md bridgellm block)')
  .action(async () => {
    try {
      await clean(process.cwd());
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command('reset')
  .description('Remove everything (local + global config) and start fresh')
  .action(async () => {
    try {
      await reset(process.cwd());
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program.parse();
