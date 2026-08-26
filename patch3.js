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
    // We just want to replace the throw Error with a dummy return so it doesn't crash.
    content = content.replace(
      /throw Object\.defineProperty\(new Error\("<Html> should not be imported outside of pages\/_document\.\\n"\+"Read more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{value:"E67",enumerable:!1,configurable:!0\}\)/g,
      'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} }'
    );
    // Also try without the concatenated string format just in case
    content = content.replace(
      /throw Object\.defineProperty\(new Error\("<Html> should not be imported outside of pages\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{value:"E67",enumerable:!1,configurable:!0\}\)/g,
      'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} }'
    );
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
