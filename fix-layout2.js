const fs = require('fs');
const file = 'components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        } else if (false) {
          const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
        window.location.reload();
        return;
      }
      const data = await res.json();`;

content = content.replace(target, '');
fs.writeFileSync(file, content);
