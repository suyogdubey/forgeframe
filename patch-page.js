const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      console.error(err);`;
const replacement = `      if (err.message === "Failed to fetch") {
        console.warn("Generation request aborted or network error");
      } else {
        console.error(err);
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Patched page.tsx");
