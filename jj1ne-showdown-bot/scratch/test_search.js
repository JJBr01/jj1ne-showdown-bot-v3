// Test web search
async function testSearch() {
  const query = 'gen 9 champions vgc 2026 reg m-c';
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  console.log('Searching DuckDuckGo:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  console.log('HTML response length:', html.length);
  
  // Extract results
  const results = [];
  const linkRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRegex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  const titleRegex = /<a class="result__title"[^>]*>([\s\S]*?)<\/a>/g;

  // Simple token parser
  const blocks = html.split('<div class="result results_links');
  for (let i = 1; i < Math.min(blocks.length, 6); i++) {
    const block = blocks[i];
    const titleM = block.match(/<a class="result__title"[^>]*>([\s\S]*?)<\/a>/);
    const snippetM = block.match(/<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const urlM = block.match(/href="([^"]+)"/);

    const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
    const snippet = snippetM ? snippetM[1].replace(/<[^>]+>/g, '').trim() : '';
    let link = urlM ? urlM[1] : '';
    if (link.includes('uddg=')) {
      const decoded = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
      link = decoded;
    }
    if (title) {
      results.push({ title, snippet, link });
    }
  }

  console.log('Found results:', results.length);
  console.log(JSON.stringify(results.slice(0, 2), null, 2));
}

testSearch().catch(console.error);
