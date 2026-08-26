const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} };\n        //             value: "E67",\n            enumerable: false,\n            configurable: true\n        });',
    'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} }; /*'
  );
  // Also we can just replace the whole block by matching it manually
  if (content.includes('value: "E67",')) {
      // Find the start of the return we added
      content = content.replace(
          /return \{ inAmpMode: false, docComponentsRendered: \{\}, __NEXT_DATA__: \{\} \};\n\s*\/\/\s*value: "E67",\n\s*enumerable: false,\n\s*configurable: true\n\s*\}\);/g,
          'return { inAmpMode: false, docComponentsRendered: {}, __NEXT_DATA__: {} };'
      );
      // Wait, let's just do a blanket regex to remove the rest of the Object.defineProperty
      content = content.replace(
          /\/\/\s*value: "E67",\n\s*enumerable: false,\n\s*configurable: true\n\s*\}\);/g,
          ''
      );
      content = content.replace(
          /value: "E67",\n\s*enumerable: false,\n\s*configurable: true\n\s*\}\);/g,
          ''
      );
  }
  fs.writeFileSync(file, content);
}

fixFile('node_modules/next/dist/shared/lib/html-context.shared-runtime.js');
fixFile('node_modules/next/dist/esm/shared/lib/html-context.shared-runtime.js');
