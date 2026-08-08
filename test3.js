const fs = require('fs');
const data = JSON.parse(fs.readFileSync('kosakata.json', 'utf-8'));

function normalizeArabic(text) {
  return text
    .replace(/\u0670/g, '\u0627') // superscript alef -> alef
    .replace(/[\u064B-\u065F]/g, '') // harakat
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u06D6-\u06ED]/g, '') // signs
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // zero-width
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // alef variants
    .replace(/\u0629/g, '\u0647') // taa marbuta -> haa
    .replace(/\u0649/g, '\u064A') // alef maqsura -> yaa
    .replace(/ؤ/g, 'و') // hamza on waw -> waw (sometimes useful)
    .replace(/ئ/g, 'ي') // hamza on yaa -> yaa
    .replace(/ء/g, '') // drop isolated hamza for easier matching
    .trim();
}

function getBaseMatchWord(normWord) {
    let w = normWord;
    if (w.length > 3 && w.endsWith('ه')) {
        w = w.slice(0, -1);
    }
    // Also remove alif if it ends with it (e.g. سماء -> سما)
    if (w.length > 3 && w.endsWith('ا')) {
        w = w.slice(0, -1);
    }
    return w;
}

let failed = [];

data.forEach(item => {
  if (!item.contoh_ayat_ar) return;
  const normWord = normalizeArabic(item.kata_arab);
  const searchStr = getBaseMatchWord(normWord);
  const words = item.contoh_ayat_ar.split(' ');
  
  let found = false;
  words.forEach(w => {
    if (normalizeArabic(w).includes(searchStr)) {
      found = true;
    }
  });
  
  if (!found) {
    failed.push({
      kata: item.kata_arab,
      normKata: normWord,
      searchStr: searchStr,
      ayat: item.contoh_ayat_ar
    });
  }
});

console.log(`Failed: ${failed.length} / ${data.length}`);
console.log(failed.slice(0, 10));
