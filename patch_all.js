const fs = require('fs');
function patchFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  const dummyContext = 'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {}, styles: [], buildManifest: { polyfillFiles: [], devFiles: [], lowPriorityFiles: [], rootMainFiles: [], pages: { "/_app": [] }, ampDevFiles: [], ampFirstPages: [] }, assetPrefix: "", scriptLoader: { __html: "" }, nonce: "" }';

  content = content.replace(
    'throw Object.defineProperty(new Error("<Html> should not be imported outside of pages/_document.\\n" + \'Read more: https://nextjs.org/docs/messages/no-document-import-in-page\'), "__NEXT_ERROR_CODE", {',
    `${dummyContext};\n        // `
  );
  
  content = content.replace(
    /throw Object\.defineProperty\(new Error\("<Html> should not be imported outside of pages\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{[^}]+\}\)/g,
    dummyContext
  );

  content = content.replace(
    /throw Object\.defineProperty\(Error\("<Html> should not be imported outside of pages\/_document\.\\nRead more: https:\/\/nextjs\.org\/docs\/messages\/no-document-import-in-page"\),"__NEXT_ERROR_CODE",\{[^}]+\}\)/g,
    dummyContext
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Patched:', file);
  }
}

const files = [
  'node_modules/next/dist/shared/lib/html-context.shared-runtime.js',
  'node_modules/next/dist/esm/shared/lib/html-context.shared-runtime.js',
  'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js',
  'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.dev.js'
];

for (const file of files) patchFile(file);
