const fs = require('fs');
const path = require('path');
function replaceInFile(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const oldContent = content;
    // Replace throw new Error("<Html> should not be imported...") with return {}
    content = content.replace(/throw new Error\("[^"]*<Html> should not be imported[^"]*"\)/g, "return {}");
    if (content !== oldContent) {
      fs.writeFileSync(file, content);
      console.log('Patched ' + file);
    }
  }
}
replaceInFile(path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js'));
replaceInFile(path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js'));
replaceInFile(path.join(__dirname, 'node_modules/next/dist/server/lib/html-context.js'));
replaceInFile(path.join(__dirname, 'node_modules/next/dist/shared/lib/html-context.shared-runtime.js'));
