const fs = require('fs');
const file = 'components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {\n          const data = await res.json();\n          if (data && data.credits !== undefined) {\n            setCredits(data.credits);\n          }\n        }',
  'if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {\n          const data = await res.json();\n          if (data && data.credits !== undefined) {\n            setCredits(data.credits);\n          }\n        } else if (contentType && contentType.indexOf("text/html") !== -1 && res.url.includes("__cookie_check")) {\n          window.location.reload();\n        }'
);
fs.writeFileSync(file, content);
