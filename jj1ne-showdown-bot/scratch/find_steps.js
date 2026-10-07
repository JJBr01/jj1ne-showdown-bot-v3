const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/Justin/.gemini/antigravity-ide/brain/58be2d97-7977-451d-86cb-c5965c9bd43a/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":571')) {
      const obj = JSON.parse(line);
      console.log('CONTENT STEP 571:\n', obj.content);
      break;
    }
  }
}
main();
