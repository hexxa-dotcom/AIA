const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  // Ignora a sidebar
  if (file.includes('Sidebar.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/border-black\/(\d+)/g, 'border-ink/$1');
  content = content.replace(/divide-black\/(\d+)/g, 'divide-ink/$1');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
    changedCount++;
  }
});

console.log('Total files changed:', changedCount);
