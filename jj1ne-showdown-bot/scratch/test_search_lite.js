async function search(q) {
  const url = 'https://lite.duckduckgo.com/lite/';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: 'q=' + encodeURIComponent(q)
  });
  const text = await res.text();
  console.log('HTML size:', text.length);

  const results = [];
  // Parse rows: table with class 'results'
  const linkMatches = [...text.matchAll(/<a[^>]+class=['"]result-link['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi)];
  const snippetMatches = [...text.matchAll(/<td class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)];

  for (let i = 0; i < Math.min(linkMatches.length, 5); i++) {
    const title = linkMatches[i][2].replace(/<[^>]+>/g, '').trim();
    let link = linkMatches[i][1];
    if (link.includes('uddg=')) {
      link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
    }
    const snippet = (snippetMatches[i] ? snippetMatches[i][1] : '').replace(/<[^>]+>/g, '').trim();
    results.push({ title, snippet, link });
  }

  return results;
}

search('vgc 2026 champions reg m-c dragonite').then(r => console.log('Results:\n', JSON.stringify(r, null, 2))).catch(console.error);
