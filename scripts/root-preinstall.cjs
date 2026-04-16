const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
['package-lock.json', 'yarn.lock'].forEach((filename) => {
  try {
    fs.unlinkSync(path.join(root, filename));
  } catch (error) {
    // ignore missing files
  }
});
const userAgent = process.env.npm_config_user_agent || '';
if (!/^pnpm\//.test(userAgent)) {
  console.error('Use pnpm instead');
  process.exit(1);
}
