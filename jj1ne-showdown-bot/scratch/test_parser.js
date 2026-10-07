const fs = require('fs');

function parseLite(html) {
  const results = [];
  const linkMatches = [...html.matchAll(/<a\s+[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi)];
  const snippetMatches = [...html.matchAll(/<td\s+[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)];

  for (let i = 0; i < Math.min(linkMatches.length, 5); i++) {
    const fullTag = linkMatches[i][0];
    const title = linkMatches[i][1].replace(/<[^>]+>/g, '').trim();
    const hrefM = fullTag.match(/href=['"]([^'"]+)['"]/i);
    let link = hrefM ? hrefM[1] : '';
    if (link.includes('uddg=')) {
      try {
        link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
      } catch (e) {}
    }
    const snippet = (snippetMatches[i] ? snippetMatches[i][1] : '').replace(/<[^>]+>/g, '').trim();
    results.push({ title, snippet, link });
  }
  return results;
}

const html = fs.readFileSync('scratch/lite.html', 'utf8');
const res = parseLite(html);
console.log('Parsed successfully:', res.length);
console.log(JSON.stringify(res, null, 2));
