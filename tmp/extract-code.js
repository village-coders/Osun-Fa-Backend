const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\awwal\\OneDrive\\Desktop\\Osun Fa Website\\backend\\node_modules\\@vladmandic\\face-api\\dist\\face-api.node.js';
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// The error was at line 7, column 30338 (1-indexed)
const lineIndex = 6;
const colIndex = 30337;

const line = lines[lineIndex];
let output = '';
if (line) {
const start = Math.max(0, colIndex - 2000);
const end = Math.min(line.length, colIndex + 2000);
output = '--- Context around line 7, col 30338 (larger window) ---\n';
output += line.substring(start, end) + '\n';
output += '----------------------------------------\n';
} else {
    output = 'Line 7 not found\n';
}
fs.writeFileSync('c:\\Users\\awwal\\OneDrive\\Desktop\\Osun Fa Website\\backend\\tmp\\extract-output.txt', output, 'utf8');
console.log('Output written to tmp/extract-output.txt');
