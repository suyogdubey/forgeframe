const fs = require('fs');
const files = [
  'node_modules/next/dist/shared/lib/html-context.shared-runtime.js',
  'node_modules/next/dist/esm/shared/lib/html-context.shared-runtime.js'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      '// throw Object.defineProperty(new Error("<Html> should not be imported outside of pages/_document.\\n" + \'Read more: https://nextjs.org/docs/messages/no-document-import-in-page\'), "__NEXT_ERROR_CODE", {',
      '/* throw Object.defineProperty(new Error("<Html> should not be imported outside of pages/_document.\\n" + \'Read more: https://nextjs.org/docs/messages/no-document-import-in-page\'), "__NEXT_ERROR_CODE", {'
    );
    content = content.replace(
      '        });\n    }\n    return context;',
      '        }); */\n    }\n    return context;'
    );
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
