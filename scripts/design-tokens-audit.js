#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../apps/web');
const ignored = new Set(['node_modules', '.next', 'coverage']);
const files = [];

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (ignored.has(entry.name)) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(absolute);
        else if (entry.name.endsWith('.css')) files.push(absolute);
    }
}

visit(root);
const colorPattern = /(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i;
const radiusPattern = /border-radius:\s*[^;]*\d+px/i;
const fontPattern = /font-size:\s*([\d.]+)(px|rem|em)/i;
const MIN_FONT_PX = 12.5;
const findings = [];

function fontSizePx(line) {
    const match = line.match(fontPattern);
    if (!match) return null;
    const value = Number.parseFloat(match[1]);
    if (Number.isNaN(value)) return null;
    if (match[2] === 'px') return value;
    return value * 16;
}

for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
        const value = line.trim();
        const location = `${path.relative(root, file)}:${index + 1} ${value}`;
        if (value.startsWith('--')) return;
        if (colorPattern.test(value)) findings.push(`${location}\n    literal colour — declare a semantic token instead`);
        // Radii must come from the radius scale so every surface matches.
        if (radiusPattern.test(value) && !value.includes('var('))
            findings.push(`${location}\n    literal radius — use --radius-control / --radius-card / --radius-sheet / --radius-pill`);
        // Nothing a player must read in real time may rely on sub-13px text.
        const size = fontSizePx(value);
        if (size !== null && size < MIN_FONT_PX)
            findings.push(`${location}\n    font size ${size.toFixed(1)}px is below the ${MIN_FONT_PX}px legibility floor`);
        // Font sizes must be rem so the "Text size" accessibility setting can scale them.
        if (/font-size:\s*[\d.]+px/i.test(value) && !value.includes('calc(')) {
            findings.push(`${location}\n    px font size — use rem so --user-text-scale can scale it`);
        }
    });
}

if (findings.length) {
    console.error('Design token audit failed. Literal colours, ad-hoc radii, px font sizes and sub-13px text are not allowed.');
    findings.forEach((finding) => console.error(`  ${finding}`));
    process.exit(1);
}

console.log(`Design token audit passed: ${files.length} CSS file(s), no colour, radius or legibility debt.`);
