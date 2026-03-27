import fs from 'fs';

const forgeFile = fs.readFileSync('src/commands/forge.ts', 'utf-8');

// Quick and dirty extraction
let startObj = forgeFile.indexOf('const BLUEPRINTS: Record<string, any> = {');
let endObj = forgeFile.indexOf('export async function executeForge');

let objStr = forgeFile.substring(startObj, endObj).trim();
objStr = objStr.replace('const BLUEPRINTS: Record<string, any> = ', '');
if (objStr.endsWith(';')) objStr = objStr.slice(0, -1);

console.log(objStr.length);
