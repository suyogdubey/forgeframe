const fs = require('fs');
const file = 'components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  async function fetchCredits(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        const res = await fetch('/api/user/profile', {
          headers: {
            'Authorization': \`Bearer \${session.access_token}\`
          }
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data && data.credits !== undefined) {
            setCredits(data.credits);
          }
        } else if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
          window.location.reload();
          return;
        }
      } catch (err) {
        console.error("Error fetching credits:", err);
      }
    }
  };`;

content = content.replace(/async function fetchCredits\(userId: string\) \{[\s\S]*?\} catch \(err\) \{[\s\S]*?console\.error\("Error fetching credits:", err\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/, replacement);
fs.writeFileSync(file, content);
