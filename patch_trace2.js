const fs = require('fs');

function addTrace(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /throw Object\.defineProperty\(Error\("<Html> should not be imported outside of pages\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{value:"E67",enumerable:!1,configurable:!0\}\)/g,
    '{ console.error("!!! Missing HtmlContext! Stack:", new Error().stack); throw Object.defineProperty(Error("<Html> should not be imported outside of pages/_document.\\nRead more: https://nextjs.org/docs/messages/no-document-import-in-page"), "__NEXT_ERROR_CODE", {value: "E67", enumerable: !1, configurable: !0}) }'
  );
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

addTrace('node_modules/next/dist/compiled/next-server/pages.runtime.prod.js');
addTrace('node_modules/next/dist/compiled/next-server/pages.runtime.dev.js');
addTrace('node_modules/next/dist/compiled/next-server/pages-turbo.runtime.prod.js');
addTrace('node_modules/next/dist/compiled/next-server/pages-turbo.runtime.dev.js');
