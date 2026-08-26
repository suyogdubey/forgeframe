const fs = require('fs');

function addTrace(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'if (!context) {',
    'if (!context) { console.error("!!! Missing HtmlContext! Stack trace:", new Error().stack);'
  );
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

addTrace('node_modules/next/dist/shared/lib/html-context.shared-runtime.js');
addTrace('node_modules/next/dist/esm/shared/lib/html-context.shared-runtime.js');
