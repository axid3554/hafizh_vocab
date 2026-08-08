const fs = require('fs');
const data = JSON.parse(fs.readFileSync('kosakata.json', 'utf-8'));

function normalizeArabic(text) {
  return text
    .replace(/\u0670/g, '\u0627') // superscript alef -> normal alef
    .replace(/[\u064B-\u065F]/g, '') // harakat
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u06D6-\u06ED]/g, '') // signs
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // zero-width
    .replace(/\u0629/g, '\u0647') // taa marbuta -> haa
    .replace(/\u0649/g, '\u064A') // alef maqsura -> yaa
    .trim();
}

function isSubsequence(sub, str) {
  let i = 0;
  for (let j = 0; j < str.length; j++) {
    if (sub[i] === str[j]) {
      i++;
    }
    if (i === sub.length) return true;
  }
  return false;
}

// Some words have taa marbuta which becomes haa or taa, or are plural.
// We can take the first 3 letters of the normalized word as the base root approximation
function getRootApprox(normWord) {
  // If the word has Alif Lam (ال), remove it for approximation
  let w = normWord;
  if (w.startsWith('ال') && w.length > 4) {
    w = w.substring(2);
  }
  // Strip common suffixes for approximation (ه, ا, ون, ين, ات)
  if (w.length > 3) {
      if (w.endsWith('ه') || w.endsWith('ا') || w.endsWith('ت')) w = w.slice(0, -1);
  }
  
  // Return at most 3 chars
  return w.substring(0, 3);
}

let failed = [];
let successDetails = [];

data.forEach(item => {
  if (!item.contoh_ayat_ar) return;
  const normWord = normalizeArabic(item.kata_arab);
  const approx = getRootApprox(normWord);
  
  const words = item.contoh_ayat_ar.split(' ');
  
  let bestWord = null;
  
  // First try direct includes
  for (let w of words) {
    if (normalizeArabic(w).includes(normWord)) {
      bestWord = w;
      break;
    }
  }
  
  // Next try subsequence of the approximation
  if (!bestWord) {
    for (let w of words) {
      if (isSubsequence(approx, normalizeArabic(w))) {
        bestWord = w;
        break;
      }
    }
  }
  
  if (!bestWord) {
    failed.push({ kata: item.kata_arab, ayat: item.contoh_ayat_ar });
  } else {
    successDetails.push({ kata: item.kata_arab, approx: approx, match: bestWord });
  }
});

console.log(`Failed: ${failed.length} / ${data.length}`);
console.log(failed.slice(0, 10));
