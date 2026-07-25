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
const findings = [];

for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
        const value = line.trim();
        if (!colorPattern.test(value)) return;
        if (value.startsWith('--')) return;
        findings.push(`${path.relative(root, file)}:${index + 1} ${value}`);
    });
}

if (findings.length) {
    console.error('Design token audit failed. Literal colors must be declared as semantic tokens.');
    findings.forEach((finding) => console.error(`  ${finding}`));
    process.exit(1);
}

console.log(`Design token audit passed: ${files.length} CSS file(s), zero legacy or new color debt.`);
