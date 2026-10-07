const fs = require('fs');

async function check() {
  const res = await fetch('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: 'q=pokemon+vgc'
  });
  const html = await res.text();
  fs.writeFileSync('scratch/lite.html', html, 'utf8');
  console.log('Saved lite.html, length:', html.length);
}

check();
