// Builds pet.js, the one file a site includes: pet.js's own header comment (what Henni is and
// does) followed by the Ink colourway that tools/colorways.py generates from variants/big-hoodie.js.
//   python3 tools/colorways.py && node tools/build-pet.mjs
import fs from 'fs';
const START = '\n(function () {\n';
const pet = fs.readFileSync('pet.js', 'utf8'), ink = fs.readFileSync('variants/bh-ink.js', 'utf8');
const h = pet.indexOf(START), b = ink.indexOf(START);
if (h < 0 || b < 0) { console.error('pet.js or variants/bh-ink.js has no "(function () {" line'); process.exit(1); }
fs.writeFileSync('pet.js', pet.slice(0, h + 1) + ink.slice(b + 1));
console.log(`pet.js: ${(fs.statSync('pet.js').size / 1024).toFixed(1)} KB`);
