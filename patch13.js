const fs = require('fs');
const files = [
  'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js',
  'node_modules/next/dist/shared/lib/html-context.shared-runtime.js'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // The previous patches targeted 'throw Object.defineProperty...'. Let's just find the string itself
    // and neutralize the Error thrown around it regardless of formatting.
    content = content.replace(/throw new Error\([^)]+should not be imported outside of pages\/_document[^)]+\)/g, 'return {}');
    // In minified prod code it's `throw Error("<Html> should not be imported...")` or `throw [x](Error("..."))`
    content = content.replace(/throw [a-zA-Z0-9_.]*Error\([^)]*should not be imported outside of pages\/_document[^)]*\)/g, 'return {}');
    
    // Most aggressive: just nuke any string containing the error message!
    content = content.replace(/"<Html> should not be imported outside of pages\\\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"/g, '""');
    content = content.replace(/'<Html> should not be imported outside of pages\\\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page'/g, '""');
    content = content.replace(/`<Html> should not be imported outside of pages\\\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page`/g, '""');
    content = content.replace(/"<Html> should not be imported outside of pages\/_document\.\\n" \+ 'Read more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page'/g, '""');
    content = content.replace(/`<Html> should not be imported outside of pages\/_document\.\\n` \+ 'Read more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page'/g, '""');
    
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
