const fs = require('fs');
const files = [
  'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js',
  'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.dev.js'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /this\.context;/g,
      'this.context || {};'
    );
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
