const sentence = "وَإِلَىٰ عَادٍ أَخَاهُمْ هُودًا ۗ قَالَ يَٰقَوْمِ ٱعْبُدُوا۟ ٱللَّهَ مَا لَكُم مِّنْ إِلَٰهٍ غَيْرُهُۥ";
const word = "قَوْمٌ";

const normalize = (str) => {
  return str
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/[ةه]/g, 'ه');
};

const normWord = normalize(word);
console.log("normWord:", normWord);
const words = sentence.split(' ');
const highlightedWords = words.map(w => {
  console.log("word:", w, "norm:", normalize(w), "includes:", normalize(w).includes(normWord));
  if (normalize(w).includes(normWord)) {
    return `<span class="highlight-arab">${w}</span>`;
  }
  return w;
});
console.log(highlightedWords.join(' '));
