const fs = require('fs');
const file = 'components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      } catch (err: any) {
        if (err.message === "Failed to fetch") {
          console.warn("Fetch credits failed (likely due to page reload)");
        } else {
          console.error("Error fetching credits:", err);
        }
      }`;

const replacement = `      } catch (err: any) {
        if (err?.message === "Failed to fetch" || String(err).includes("Failed to fetch")) {
          console.warn("Fetch credits failed (likely due to page reload)");
        } else {
          console.error("Error fetching credits:", err);
        }
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Patched AppLayout.tsx again");
