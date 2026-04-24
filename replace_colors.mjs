import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const replacements = [
  { regex: /(?<!dark:)text-ink-100/g, replacement: 'text-slate-900 dark:text-ink-100' },
  { regex: /(?<!dark:)text-ink-300/g, replacement: 'text-slate-600 dark:text-ink-300' },
  { regex: /(?<!dark:)text-ink-400/g, replacement: 'text-slate-500 dark:text-ink-400' },
  { regex: /(?<!dark:)text-ink-500/g, replacement: 'text-slate-400 dark:text-ink-500' },
  
  { regex: /(?<!dark:)bg-ink-800\/60/g, replacement: 'bg-slate-100 dark:bg-ink-800/60' },
  { regex: /(?<!dark:)bg-ink-800\/80/g, replacement: 'bg-slate-200 dark:bg-ink-800/80' },
  { regex: /(?<!dark:)bg-ink-800\/40/g, replacement: 'bg-slate-50 dark:bg-ink-800/40' },
  { regex: /(?<!dark:)bg-ink-800\/30/g, replacement: 'bg-slate-50 dark:bg-ink-800/30' },
  { regex: /(?<!dark:)bg-ink-900\/40/g, replacement: 'bg-slate-50/40 dark:bg-ink-900/40' },
  
  { regex: /(?<!dark:)border-ink-700/g, replacement: 'border-slate-200 dark:border-ink-700' },
  { regex: /(?<!dark:)border-ink-800/g, replacement: 'border-slate-200 dark:border-ink-800' },
  { regex: /(?<!dark:)border-ink-500/g, replacement: 'border-slate-300 dark:border-ink-500' },
  { regex: /(?<!dark:)border-ink-600/g, replacement: 'border-slate-300 dark:border-ink-600' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  }
}

processDir(pagesDir);
