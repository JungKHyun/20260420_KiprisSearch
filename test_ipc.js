const fs = require('fs');
console.time('parse');
const data = fs.readFileSync('IpcCodeIndex.xml', 'utf8');

const ipcCache = {};
const entries = data.split('<CWIndication>');
for (let i = 1; i < entries.length; i++) {
  const chunk = entries[i];
  const indEnd = chunk.indexOf('</CWIndication>');
  if (indEnd === -1) continue;
  
  const indication = chunk.substring(0, indEnd);
  
  const refMatches = chunk.match(/(?:ref=\"|endRef=\")[A-Z]\d{2}[A-Z]/g);
  if (refMatches) {
    for (let m of refMatches) {
      const code = m.substring(m.length - 4);
      if (!ipcCache[code]) ipcCache[code] = new Set();
      ipcCache[code].add(indication);
    }
  }
}
console.timeEnd('parse');
console.log(Array.from(ipcCache['E01D'] || []).slice(0, 10));
