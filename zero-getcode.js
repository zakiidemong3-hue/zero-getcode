#!/usr/bin/env node
/* ============================================================
   ZERO GET CODE — Web Source Code Fetcher
   Run: node zero-getcode.js
   ============================================================ */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ========== CONFIG ==========
const CONFIG = {
  DATA_DIR: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.zero-getcode'),
};

if (!fs.existsSync(CONFIG.DATA_DIR)) {
  fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
}

// ========== COLORS ==========
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  gray: '\x1b[90m',
};
const c = (code, text) => `${code}${text}${C.reset}`;
const bold = t => c(C.bold, t);
const dim = t => c(C.dim, t);
const cyan = t => c(C.cyan, t);
const green = t => c(C.green, t);
const yellow = t => c(C.yellow, t);
const red = t => c(C.red, t);
const magenta = t => c(C.magenta, t);
const gray = t => c(C.gray, t);

// ========== READLINE ==========
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(resolve => rl.question(q, resolve)); }
function closeRL() { console.log(gray('\nGoodbye! 👋')); rl.close(); process.exit(0); }

// ========== SPINNER ==========
class Spinner {
  constructor(text) {
    this.text = text;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.idx = 0;
    this.interval = null;
  }
  start() {
    process.stdout.write('\x1b[?25l');
    this.interval = setInterval(() => {
      process.stdout.write('\r' + cyan(this.frames[this.idx]) + ' ' + this.text + '   ');
      this.idx = (this.idx + 1) % this.frames.length;
    }, 80);
  }
  stop(text) {
    clearInterval(this.interval);
    process.stdout.write('\r' + ' '.repeat(this.text.length + 10) + '\r');
    process.stdout.write('\x1b[?25h');
    if (text) console.log(green('✓') + ' ' + text);
  }
}

// ========== HEADER ==========
function clearScreen() { process.stdout.write('\x1b[2J\x1b[H'); }

function printHeader() {
  clearScreen();
  console.log(cyan('╭──────────────────────────────────────────────╮'));
  console.log(cyan('│') + bold('  🌐 ZERO GET CODE v1.0') + cyan('                      │'));
  console.log(cyan('│') + dim('  Fetch HTML, CSS, JS from any website') + cyan('        │'));
  console.log(cyan('╰──────────────────────────────────────────────╯'));
  console.log('');
}

// ========== MAIN ==========
async function main() {
  printHeader();

  const url = await ask(cyan('?') + ' Enter website URL (with https://): ');

  if (!url.startsWith('http')) {
    console.log(red('✗ Invalid URL! Must start with http:// or https://'));
    console.log('');
    await ask(gray('Press Enter to retry...'));
    return await main();
  }

  const spinner = new Spinner('Fetching source code...');
  spinner.start();

  try {
    const res = await fetch(url);
    const html = await res.text();
    spinner.stop('Done!');

    // Extract CSS
    const cssLinks = [...html.matchAll(/<link[^>]*href="([^"]*\.css[^"]*)"[^>]*>/gi)].map(m => m[1]);
    const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);

    // Extract JS
    const jsLinks = [...html.matchAll(/<script[^>]*src="([^"]*\.js[^"]*)"[^>]*>/gi)].map(m => m[1]);
    const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

    const domain = new URL(url).hostname.replace(/\./g, '_');

    console.log('');
    console.log(bold('📊 Page Info:'));
    console.log(`  URL         : ${cyan(url)}`);
    console.log(`  HTML Size   : ${yellow((html.length / 1024).toFixed(1) + ' KB')}`);
    console.log(`  External CSS: ${yellow(cssLinks.length)} files`);
    console.log(`  External JS : ${yellow(jsLinks.length)} files`);
    console.log(`  Inline CSS  : ${yellow(inlineStyles.length)} blocks`);
    console.log(`  Inline JS   : ${yellow(inlineScripts.length)} blocks`);
    console.log('');
    console.log(bold('Choose action:'));
    console.log(`  ${cyan('[1]')} View HTML (first 5000 chars)`);
    console.log(`  ${cyan('[2]')} View Inline CSS`);
    console.log(`  ${cyan('[3]')} View Inline JS`);
    console.log(`  ${cyan('[4]')} List External Files`);
    console.log(`  ${cyan('[5]')} Save ALL to folder (${domain}/)`);
    console.log(`  ${cyan('[6]')} Save HTML only`);
    console.log(`  ${cyan('[0]')} Exit`);
    console.log('');

    const choice = await ask(gray('› ') + 'Choose: ');

    switch (choice.trim()) {
      case '1':
        console.log('');
        console.log(cyan('─── HTML ───'));
        console.log(html.slice(0, 5000));
        if (html.length > 5000) console.log(dim(`\n... ${html.length - 5000} more characters`));
        break;

      case '2':
        console.log('');
        console.log(cyan('─── INLINE CSS ───'));
        if (inlineStyles.length === 0) {
          console.log(dim('(no inline styles found)'));
        } else {
          console.log(inlineStyles.join('\n\n').slice(0, 4000));
          if (inlineStyles.join('').length > 4000) console.log(dim('\n... truncated'));
        }
        break;

      case '3':
        console.log('');
        console.log(cyan('─── INLINE JS ───'));
        if (inlineScripts.length === 0) {
          console.log(dim('(no inline scripts found)'));
        } else {
          console.log(inlineScripts.join('\n\n').slice(0, 4000));
          if (inlineScripts.join('').length > 4000) console.log(dim('\n... truncated'));
        }
        break;

      case '4':
        console.log('');
        console.log(bold('📁 External CSS Files:'));
        if (cssLinks.length === 0) {
          console.log(dim('  (none)'));
        } else {
          cssLinks.forEach((l, i) => console.log(`  ${yellow('[' + (i + 1) + ']')} ${l}`));
        }
        console.log('');
        console.log(bold('📁 External JS Files:'));
        if (jsLinks.length === 0) {
          console.log(dim('  (none)'));
        } else {
          jsLinks.forEach((l, i) => console.log(`  ${magenta('[' + (i + 1) + ']')} ${l}`));
        }
        break;

      case '5':
        const dir = path.join(CONFIG.DATA_DIR, domain);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
        fs.writeFileSync(path.join(dir, 'inline.css'), inlineStyles.join('\n\n') || '/* no inline styles */');
        fs.writeFileSync(path.join(dir, 'inline.js'), inlineScripts.join('\n\n') || '// no inline scripts');
        // Save list of external files
        fs.writeFileSync(path.join(dir, 'external-files.txt'),
          'EXTERNAL CSS:\n' + cssLinks.join('\n') + '\n\nEXTERNAL JS:\n' + jsLinks.join('\n'));
        console.log('');
        console.log(green('✓ All files saved!'));
        console.log(gray(`  Folder: ${dir}/`));
        console.log(gray(`  Files : index.html, inline.css, inline.js, external-files.txt`));
        break;

      case '6':
        const htmlFile = path.join(CONFIG.DATA_DIR, `${domain}.html`);
        fs.writeFileSync(htmlFile, html);
        console.log('');
        console.log(green('✓ HTML saved!'));
        console.log(gray(`  File: ${htmlFile}`));
        break;

      case '0':
        closeRL();
        break;

      default:
        console.log(red('Invalid option!'));
    }

  } catch (err) {
    spinner.stop(null);
    console.log('');
    console.log(red('✗ Error: ') + err.message);
    console.log(dim('  Check your internet or the URL.'));
  }

  console.log('');
  const again = await ask(cyan('?') + ' Fetch another URL? (y/n): ');
  if (again.toLowerCase() === 'y') {
    await main();
  } else {
    closeRL();
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('');
  console.log(gray('\nGoodbye! 👋'));
  rl.close();
  process.exit(0);
});

main().catch(err => {
  console.error(red('Error:'), err);
  closeRL();
});    console.log(`  CSS Files   : ${yellow(cssLinks.length)} external, ${yellow(inlineStyles.length)} inline`);
    console.log(`  JS Files    : ${yellow(jsLinks.length)} external, ${yellow(inlineScripts.length)} inline`);
    console.log('');

    console.log(`  ${cyan('[1]')} View/Save HTML`);
    console.log(`  ${cyan('[2]')} View/Save CSS (inline)`);
    console.log(`  ${cyan('[3]')} View/Save JS (inline)`);
    console.log(`  ${cyan('[4]')} List External Files`);
    console.log(`  ${cyan('[5]')} Save ALL to folder`);
    console.log(`  ${cyan('[6]')} Back`);
    console.log('');

    const choice = await ask(gray('› ') + 'Choose: ');

    switch (choice.trim()) {
      case '1':
        console.log('');
        console.log(cyan('─── HTML ───'));
        console.log(html.slice(0, 5000));
        if (html.length > 5000) console.log(dim(`\n... ${(html.length - 5000)} more characters`));
        const saveHtml = await ask(cyan('?') + ' Save HTML to file? (y/n): ');
        if (saveHtml.toLowerCase() === 'y') {
          const domain = new URL(url).hostname.replace(/\./g, '_');
          fs.writeFileSync(path.join(CONFIG.DATA_DIR, `${domain}.html`), html);
          console.log(green(`✓ Saved to ${domain}.html`));
        }
        break;
      case '2':
        console.log('');
        console.log(cyan('─── INLINE CSS ───'));
        console.log(inlineStyles.join('\n\n').slice(0, 3000) || dim('(no inline styles)'));
        break;
      case '3':
        console.log('');
        console.log(cyan('─── INLINE JS ───'));
        console.log(inlineScripts.join('\n\n').slice(0, 3000) || dim('(no inline scripts)'));
        break;
      case '4':
        console.log('');
        console.log(bold('External CSS:'));
        cssLinks.forEach(l => console.log('  ' + yellow(l)));
        console.log('');
        console.log(bold('External JS:'));
        jsLinks.forEach(l => console.log('  ' + magenta(l)));
        break;
      case '5':
        const domain2 = new URL(url).hostname.replace(/\./g, '_');
        const dir = path.join(CONFIG.DATA_DIR, domain2);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
        fs.writeFileSync(path.join(dir, 'inline.css'), inlineStyles.join('\n\n'));
        fs.writeFileSync(path.join(dir, 'inline.js'), inlineScripts.join('\n\n'));
        console.log(green(`✓ All files saved to ${dir}/`));
        logToFile(`Web source saved: ${url} → ${dir}`);
        break;
      case '6': return await mainMenu();
    }

    logToFile(`Web source fetched: ${url} (${html.length} bytes)`);
  } catch (err) {
    spinner.stop(null);
    console.log(red('✗ Error: ') + err.message);
  }

  console.log('');
  await ask(gray('Press Enter to continue...'));
  await mainMenu();
}
ENDOFSCRIPT
