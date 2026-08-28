const fs = require('fs');
const file = 'components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
          const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
        window.location.reload();
        return;
      }
      const data = await res.json();
          if (data && data.credits !== undefined) {
            setCredits(data.credits);
          }
        }`;

const replacement = `        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data && data.credits !== undefined) {
            setCredits(data.credits);
          }
        } else if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
          window.location.reload();
          return;
        }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Fixed AppLayout");
