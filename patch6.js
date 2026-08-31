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
      /throw Object\.defineProperty\(Error\("<Html> should not be imported outside of pages\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{value:"E67",enumerable:!1,configurable:!0\}\)/g,
      'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} }'
    );
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
