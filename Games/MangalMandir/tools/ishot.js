const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1024, height: 1024 } }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + process.cwd() + '/' + process.argv[2]); await p.waitForTimeout(3000); await p.screenshot({ path: process.argv[3], omitBackground: true }); await b.close(); })();
