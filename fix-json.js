const fs = require('fs');
const glob = require('glob'); // Need to check if available, but we can just list files
const files = [
  'app/page.tsx',
  'app/post-process/page.tsx',
  'app/admin/page.tsx',
  'app/image/page.tsx',
  'app/audio/page.tsx',
  'components/AppLayout.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const data = await res\.json\(\)\.catch\(\(\) => null\);/g, 
    'const contentType = res.headers.get("content-type");\n        const data = (contentType && contentType.includes("application/json")) ? await res.json().catch(() => null) : null;');
    
  content = content.replace(/const data = await res\.json\(\);/g, 
    'const contentType = res.headers.get("content-type");\n      if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {\n        window.location.reload();\n        return;\n      }\n      const data = await res.json();');
    
  fs.writeFileSync(file, content);
});
console.log("Fixed files");
