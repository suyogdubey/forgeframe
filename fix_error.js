const fs = require('fs');
const glob = require('glob');

// Find all generated server chunks
glob('.next/server/chunks/*.js', (err, files) => {
  if (err) return console.error(err);
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('this.context')) {
      // Very aggressive monkey patch for the destructuring issue in compiled chunks
      content = content.replace(/\{styles:([^}]*)\}=this\.context/g, '{styles:$1}=this.context||{}');
      content = content.replace(/\{([^}]+)\}=this\.context/g, '{$1}=this.context||{}');
      fs.writeFileSync(file, content);
      console.log('Patched chunk:', file);
    }
  }
});
