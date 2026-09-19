import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binDir = path.resolve(__dirname, '../node_modules/.bin');

if (fs.existsSync(binDir)) {
  const files = fs.readdirSync(binDir);
  for (const file of files) {
    if (file.endsWith('.cmd')) {
      const filePath = path.join(binDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('SET dp0=%~dp0')) {
        content = content.replace(/SET dp0=%~dp0/g, 'SET "dp0=%~dp0"');
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}
