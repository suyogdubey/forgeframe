const fs = require('fs');
const files = [
  'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js',
  'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js',
  'node_modules/next/dist/shared/lib/html-context.shared-runtime.js'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace the null context reference altogether!
    // The previous error was caused by `docComponentsRendered` being mutated on a null object
    content = content.replace(/const context = useContext\(HtmlContext\)/g, 'const context = useContext(HtmlContext) || { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} }');
    content = content.replace(/let [a-zA-Z0-9_]+=useContext\([^)]*\)/g, (match) => match + '||{inAmpMode:!1,docComponentsRendered:{},__NEXT_DATA__:{}}');
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
