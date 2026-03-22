import { createInterface } from 'node:readline';

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

export function heading(text: string) {
  console.log(`\n  ${BOLD}${text}${RESET}`);
}

export function info(text: string) {
  console.log(`  ${text}`);
}

export function success(text: string) {
  console.log(`  ${GREEN}✓${RESET} ${text}`);
}

export function warn(text: string) {
  console.log(`  ${YELLOW}!${RESET} ${text}`);
}

export function error(text: string) {
  console.error(`  ${RED}✗${RESET} ${text}`);
}

export function dim(text: string) {
  console.log(`  ${DIM}${text}${RESET}`);
}

export async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${question}`, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Show a numbered list and let the user pick one.
 * Returns the selected item string.
 */
export async function select(
  label: string,
  options: string[],
  extra?: { newLabel?: string },
): Promise<{ value: string; isNew: boolean }> {
  heading(label);
  console.log('');
  options.forEach((o, i) => {
    console.log(`  ${DIM}${i + 1}.${RESET} ${o}`);
  });
  if (extra?.newLabel) {
    console.log(`  ${DIM}${options.length + 1}.${RESET} ${CYAN}+ ${extra.newLabel}${RESET}`);
  }
  console.log('');

  const input = await ask(`${DIM}Enter number${options.length > 0 ? ` (1-${options.length + (extra?.newLabel ? 1 : 0)})` : ''}:${RESET} `);
  const idx = parseInt(input, 10) - 1;

  if (idx >= 0 && idx < options.length) {
    // Extract clean name (strip any metadata in parens)
    const clean = options[idx].replace(/\s*\(.*\)$/, '');
    return { value: clean, isNew: false };
  }

  if (extra?.newLabel && (idx === options.length || isNaN(idx))) {
    const name = isNaN(idx) && input ? input : await ask('Name: ');
    return { value: name, isNew: true };
  }

  // Treat raw text input as a name
  if (input && isNaN(idx)) {
    return { value: input, isNew: true };
  }

  throw new Error('Invalid selection');
}

/**
 * Show a role picker with numbered grid layout.
 */
export async function selectRole(): Promise<string> {
  const ROLES = ['backend', 'frontend', 'web', 'mobile', 'ios', 'android', 'infra', 'data', 'qa', 'design'];

  heading('Select your role');
  console.log('');

  // Display in 2 columns
  for (let i = 0; i < ROLES.length; i += 2) {
    const left = `${DIM}${i + 1}.${RESET} ${ROLES[i]}`;
    const right = i + 1 < ROLES.length ? `${DIM}${i + 2}.${RESET} ${ROLES[i + 1]}` : '';
    console.log(`  ${left.padEnd(28)}${right}`);
  }
  console.log('');

  const input = await ask(`${DIM}Enter number or name:${RESET} `);
  const idx = parseInt(input, 10) - 1;

  if (idx >= 0 && idx < ROLES.length) {
    return ROLES[idx];
  }

  const normalized = input.toLowerCase().trim();
  const match = ROLES.find(r => r === normalized);
  if (match) return match;

  throw new Error(`Invalid role "${input}". Must be one of: ${ROLES.join(', ')}`);
}

/**
 * Show a summary box.
 */
export function summary(items: Record<string, string>) {
  console.log('');
  console.log(`  ${DIM}┌─────────────────────────────────┐${RESET}`);
  for (const [key, val] of Object.entries(items)) {
    const line = `  ${key}: ${BOLD}${val}${RESET}`;
    console.log(`  ${DIM}│${RESET} ${line.padEnd(40)}${DIM}│${RESET}`);
  }
  console.log(`  ${DIM}└─────────────────────────────────┘${RESET}`);
  console.log('');
}
