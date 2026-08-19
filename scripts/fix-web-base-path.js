const fs = require('fs');
const path = require('path');

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg']);

function normalizeBasePath(input) {
  if (!input) return '';
  let basePath = String(input).trim();
  if (!basePath) return '';
  if (!basePath.startsWith('/')) basePath = `/${basePath}`;
  if (basePath.length > 1 && basePath.endsWith('/')) basePath = basePath.slice(0, -1);
  return basePath;
}

async function* walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function patchFile(filePath, basePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!textExtensions.has(ext)) return false;

  const original = await fs.promises.readFile(filePath, 'utf8');
  let next = original;

  const useBasePath = !!basePath && basePath !== '/';

  if (useBasePath) {
    // Patch root-absolute asset paths to the provided basePath (e.g. "/rti-news").
    next = next.replaceAll('"/assets/', `"${basePath}/assets/`);
    next = next.replaceAll("'/assets/", `'${basePath}/assets/`);
    next = next.replaceAll('"/_expo/', `"${basePath}/_expo/`);
    next = next.replaceAll("'/_expo/", `'${basePath}/_expo/`);
    next = next.replaceAll('"/favicon.ico', `"${basePath}/favicon.ico`);
    next = next.replaceAll("'/favicon.ico", `'${basePath}/favicon.ico`);
    next = next.replaceAll('href="/', `href="${basePath}/`);
    next = next.replaceAll("href='/", `href='${basePath}/`);
    next = next.replaceAll('src="/', `src="${basePath}/`);
    next = next.replaceAll("src='/", `src='${basePath}/`);
  } else {
    // Make asset paths relative so the build works when opened from a folder/subpath.
    next = next.replaceAll('"/assets/', '"assets/');
    next = next.replaceAll("'/assets/", "'assets/");
    next = next.replaceAll('"/_expo/', '"_expo/');
    next = next.replaceAll("'/_expo/", "'_expo/");
    next = next.replaceAll('"/favicon.ico', '"favicon.ico');
    next = next.replaceAll("'/favicon.ico", "'favicon.ico");
    next = next.replaceAll('href="/', 'href="./');
    next = next.replaceAll("href='/", "href='./");
    next = next.replaceAll('src="/', 'src="./');
    next = next.replaceAll("src='/", "src='./");
  }

  // Fix viewport to prevent zooming on mobile (and stop iOS "input focus" auto-zoom).
  if (path.basename(filePath).toLowerCase() === 'index.html') {
    const desiredViewport = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    const viewportMetaRe = /<meta\s+[^>]*name=(["'])viewport\1[^>]*>/i;
    const contentAttrRe = /content=(["'])(.*?)\1/i;

    if (viewportMetaRe.test(next)) {
      next = next.replace(viewportMetaRe, (tag) => {
        if (contentAttrRe.test(tag)) {
          return tag.replace(contentAttrRe, `content="${desiredViewport}"`);
        }
        return tag.replace(/\s*\/?>$/, (end) => ` content="${desiredViewport}"${end}`);
      });
    } else {
      // Insert a viewport meta tag right after <meta charset="..."> when missing.
      const charsetRe = /<meta\s+charset=(["']).*?\1\s*\/?>/i;
      if (charsetRe.test(next)) {
        next = next.replace(charsetRe, (tag) => `${tag}\n    <meta name="viewport" content="${desiredViewport}" />`);
      } else {
        next = next.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}\n    <meta name="viewport" content="${desiredViewport}" />`);
      }
    }

    // Prevent mobile browsers from auto-inflating text (can look like "zoom").
    if (!/-webkit-text-size-adjust\s*:/i.test(next)) {
      const inject =
        '\n    <style id="mobile-text-size-adjust">' +
        'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}' +
        // iOS Safari auto-zooms on focus when inputs have computed font-size < 16px.
        // Force a minimum font-size for form controls to avoid that behavior.
        'input,textarea,select,button{font-size:16px !important;}' +
        '</style>\n';
      if (/<\/head>/i.test(next)) {
        next = next.replace(/<\/head>/i, `${inject}</head>`);
      } else if (/<head(\s[^>]*)?>/i.test(next)) {
        next = next.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}${inject}`);
      }
    }
  }

  if (next === original) return false;
  await fs.promises.writeFile(filePath, next, 'utf8');
  return true;
}

async function main() {
  const distDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('dist');
  const basePath = normalizeBasePath(process.argv[3] || process.env.WEB_BASE_PATH);

  if (!fs.existsSync(distDir)) {
    process.stderr.write(`[fix-web-base-path] Output dir not found: ${distDir}\n`);
    process.exitCode = 1;
    return;
  }

  let changed = 0;
  for await (const filePath of walk(distDir)) {
    // Skip node_modules inside dist (if any).
    if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (await patchFile(filePath, basePath)) changed += 1;
  }

  if (basePath && basePath !== '/') {
    process.stdout.write(`[fix-web-base-path] Patched ${changed} file(s) with basePath="${basePath}".\n`);
  } else {
    process.stdout.write(`[fix-web-base-path] Patched ${changed} file(s) to use relative asset paths.\n`);
  }
}

main().catch((err) => {
  console.error('[fix-web-base-path] Failed:', err);
  process.exitCode = 1;
});
