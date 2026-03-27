import { createInterface, emitKeypressEvents } from 'node:readline';

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Restore cursor on exit (in case of crash during selection)
process.on('exit', () => {
  process.stdout.write('\x1b[?25h');
});

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
 * Arrow-key navigable select list.
 * Use ↑/↓ to move, Enter to confirm.
 */
export async function select(
  label: string,
  options: string[],
  extra?: { newLabel?: string; defaultIndex?: number },
): Promise<{ value: string; isNew: boolean }> {
  const items = [...options];
  const newIdx = extra?.newLabel ? items.length : -1;
  if (extra?.newLabel) items.push(`+ ${extra.newLabel}`);

  let selected = extra?.defaultIndex ?? 0;
  if (selected < 0 || selected >= items.length) selected = 0;

  const totalLines = items.length;

  // Print label
  if (label) {
    heading(label);
    console.log('');
  }

  // Initial render
  renderItems(items, selected, newIdx);

  // Hide cursor during selection
  process.stdout.write('\x1b[?25l');

  return new Promise((resolve) => {
    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();

    const onKeypress = (_str: string | undefined, key: { name: string; ctrl?: boolean }) => {
      if (!key) return;

      if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
      }

      if (key.name === 'up' && selected > 0) {
        selected--;
        rerender(items, selected, totalLines, newIdx);
      } else if (key.name === 'down' && selected < items.length - 1) {
        selected++;
        rerender(items, selected, totalLines, newIdx);
      } else if (key.name === 'return') {
        cleanup();
        console.log('');

        if (selected === newIdx) {
          resolve({ value: '', isNew: true });
        } else {
          const clean = options[selected].replace(/\s*\(.*\)$/, '');
          resolve({ value: clean, isNew: false });
        }
      }
    };

    const cleanup = () => {
      process.stdout.write('\x1b[?25h'); // show cursor
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdin.on('keypress', onKeypress);
  });
}

function formatItem(item: string, index: number, selected: number, newIdx: number): string {
  const arrow = index === selected ? `${GREEN}❯${RESET}` : ' ';
  let text: string;
  if (index === selected) {
    text = index === newIdx ? `${CYAN}${item}${RESET}` : `${CYAN}${BOLD}${item}${RESET}`;
  } else {
    text = `${DIM}${item}${RESET}`;
  }
  return `  ${arrow} ${text}`;
}

function renderItems(items: string[], selected: number, newIdx: number) {
  for (let i = 0; i < items.length; i++) {
    console.log(formatItem(items[i], i, selected, newIdx));
  }
}

function rerender(items: string[], selected: number, totalLines: number, newIdx: number) {
  process.stdout.write(`\x1b[${totalLines}A`);
  for (let i = 0; i < items.length; i++) {
    process.stdout.write('\x1b[2K');
    console.log(formatItem(items[i], i, selected, newIdx));
  }
}

/**
 * Arrow-key navigable role picker.
 */
export async function selectRole(defaultRole?: string): Promise<string> {
  const ROLES = ['backend', 'frontend', 'web', 'mobile', 'ios', 'android', 'infra', 'data', 'qa', 'design'];
  const defaultIdx = defaultRole ? Math.max(0, ROLES.indexOf(defaultRole)) : 0;

  const { value } = await select('Select your role', ROLES, { defaultIndex: defaultIdx });
  return value;
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
