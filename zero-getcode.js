cat >> zero-toolsbox.js << 'ENDOFSCRIPT'

// ========== 12. WEB SOURCE CODE GETTER ==========
async function webSourceGetter() {
  printHeader();
  console.log(bold('🌐 Web Source Code Getter'));
  console.log(gray('─'.repeat(45)));
  console.log('');

  const url = await ask(cyan('?') + ' Enter website URL (with https://): ');

  if (!url.startsWith('http')) {
    console.log(red('✗ Invalid URL!'));
    await ask(gray('Press Enter to continue...'));
    return await mainMenu();
  }

  const spinner = new Spinner('Fetching source code...');
  spinner.start();

  try {
    const res = await fetch(url);
    const html = await res.text();
    spinner.stop('Done!');

    // Extract CSS links
    const cssLinks = [...html.matchAll(/<link[^>]*href="([^"]*\.css[^"]*)"[^>]*>/gi)].map(m => m[1]);
    const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);

    // Extract JS links
    const jsLinks = [...html.matchAll(/<script[^>]*src="([^"]*\.js[^"]*)"[^>]*>/gi)].map(m => m[1]);
    const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

    console.log('');
    console.log(bold('📊 Page Info:'));
    console.log(`  HTML Size   : ${cyan((html.length / 1024).toFixed(1) + ' KB')}`);
    console.log(`  CSS Files   : ${yellow(cssLinks.length)} external, ${yellow(inlineStyles.length)} inline`);
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
