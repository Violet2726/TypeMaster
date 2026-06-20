#!/usr/bin/env node
/**
 * Design Tokens Audit Script
 * Scans CSS files for hardcoded rgba(255, 255, 255, ...) values
 * that should use CSS custom properties (tokens) instead.
 *
 * Usage: node scripts/design-tokens-audit.js [--fix]
 *   --fix  Auto-replace common patterns with token references
 */

const fs = require('fs');
const path = require('path');

const WEB_DIR = path.resolve(__dirname, '../apps/web');
const FIX_MODE = process.argv.includes('--fix');

const TOKEN_MAP = {
    'rgba(255, 255, 255, 0.02)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.025)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.03)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.035)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.04)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.045)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.05)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.055)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.06)': 'var(--bg-soft)',
    'rgba(255, 255, 255, 0.065)': 'var(--surface-2)',
    'rgba(255, 255, 255, 0.07)': 'var(--surface-2)',
    'rgba(255, 255, 255, 0.075)': 'var(--surface-2)',
    'rgba(255, 255, 255, 0.08)': 'var(--surface-2)',
    'rgba(255, 255, 255, 0.09)': 'var(--panel-stroke)',
    'rgba(255, 255, 255, 0.10)': 'var(--panel-stroke)',
    'rgba(255, 255, 255, 0.12)': 'var(--panel-stroke)',
    'rgba(255, 255, 255, 0.13)': 'var(--panel-stroke)',
};

const EXCLUDE = ['node_modules', '.git', 'dist', '.next'];

function findCssFiles(dir) {
    const results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (EXCLUDE.some(p => full.includes(p))) continue;
        if (item.isDirectory()) results.push(...findCssFiles(full));
        else if (item.name.endsWith('.css')) results.push(full);
    }
    return results;
}

function auditFile(filePath, fix) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(/rgba\(255,\s*255,\s*255,\s*0\.\d+\)/g);
        if (!matches) continue;
        for (const match of matches) {
            const token = TOKEN_MAP[match];
            if (fix && token) {
                const escaped = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                content = content.replace(new RegExp(escaped, 'g'), token);
            }
            findings.push({
                file: path.relative(WEB_DIR, filePath),
                line: i + 1,
                value: match,
                token: token || '(no mapping)',
                fixable: Boolean(token),
            });
        }
    }

    if (fix && content !== fs.readFileSync(filePath, 'utf-8')) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    return findings;
}

const files = findCssFiles(WEB_DIR);
let all = [];
let fixed = 0;
for (const f of files) {
    const r = auditFile(f, FIX_MODE);
    all.push(...r);
    fixed += r.filter(x => x.fixable && FIX_MODE).length;
}

const byFile = {};
for (const f of all) { (byFile[f.file] = byFile[f.file] || []).push(f); }

console.log('\n' + '='.repeat(60));
console.log('  Design Tokens Audit Report');
console.log('='.repeat(60) + '\n');

if (!all.length) { console.log('  All clean!\n'); process.exit(0); }

const fixable = all.filter(f => f.fixable).length;
console.log(`  Total: ${all.length}  |  Auto-fixable: ${fixable}  |  Manual: ${all.length - fixable}`);
if (FIX_MODE) console.log(`  Fixed this run: ${fixed}`);
console.log('');

for (const [file, items] of Object.entries(byFile)) {
    console.log('  ' + file);
    for (const f of items) {
        const tag = f.fixable ? (FIX_MODE ? 'FIXED' : 'auto') : 'manual';
        console.log(`    L${f.line}: ${f.value} -> ${f.token} [${tag}]`);
    }
    console.log('');
}

if (!FIX_MODE && fixable > 0) {
    console.log(`  Run with --fix to auto-replace ${fixable} values.\n`);
}
process.exit(all.length > 0 ? 1 : 0);
