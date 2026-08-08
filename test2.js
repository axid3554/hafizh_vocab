const fs = require('fs');
const data = JSON.parse(fs.readFileSync('kosakata.json', 'utf-8'));

function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[\u06D6-\u06ED]/g, '')
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

let failed = [];

data.forEach(item => {
  if (!item.contoh_ayat_ar) return;
  const normWord = normalizeArabic(item.kata_arab);
  const words = item.contoh_ayat_ar.split(' ');
  
  let found = false;
  words.forEach(w => {
    if (normalizeArabic(w).includes(normWord)) {
      found = true;
    }
  });
  
  if (!found) {
    failed.push({
      kata: item.kata_arab,
      normKata: normWord,
      ayat: item.contoh_ayat_ar
    });
  }
});

console.log(`Failed: ${failed.length} / ${data.length}`);
console.log(failed.slice(0, 10));
