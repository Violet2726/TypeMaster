import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'captures');
const baseUrl = process.env.CAPTURE_URL || 'http://localhost:5173/';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(outDir, 'home-desktop.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(outDir, 'home-mobile.png'), fullPage: true });

await browser.close();