const fs = require('fs');
const path = require('path');

const TYPE_MAP = {
  serial: 'Number',
  integer: 'Number',
  numeric: 'Number',
  varchar: 'String',
  text: 'String',
  boolean: 'Boolean',
  timestamp: 'Date',
  jsonb: 'mongoose.Schema.Types.Mixed',
};

const CONTENT = fs.readFileSync(process.argv[2], 'utf8');

function parseTableFields(tableBody) {
  const fields = [];
  tableBody.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;
    const match = trimmed.match(/^([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_]+)\(([^)]*)\)(.*),?$/);
    if (!match) return;
    const [_, name, typeName, typeArgs, tail] = match;
    const options = {};
    if (tail.includes('notNull()')) {
      options.required = true;
    }
    if (tail.includes('defaultNow()')) {
      options.default = 'Date.now';
    }
    const defaultMatch = tail.match(/default\(([^)]+)\)/);
    if (defaultMatch && !tail.includes('defaultNow()')) {
      const defaultValue = defaultMatch[1].trim();
      options.default = defaultValue;
    }
    const typeExpr = TYPE_MAP[typeName] || 'String';
    fields.push({ name, typeExpr, options });
  });
  return fields;
}

function generateSchema(name, fields) {
  const lines = ['const ' + name + ' = createMongoSchema({'];
  fields.forEach(({ name, typeExpr, options }) => {
    const parts = ['type: ' + typeExpr];
    if (options.required) parts.push('required: true');
    if (options.default) {
      if (options.default === 'Date.now') parts.push('default: Date.now');
      else parts.push('default: ' + options.default);
    }
    if (name === 'id') {
      parts.push('unique: true', 'index: true');
    }
    lines.push(`  ${name}: { ${parts.join(', ')} },`);
  });
  lines.push('});');
  return lines.join('\n');
}

const matches = [];
const regex = /export const ([a-zA-Z0-9_]+) = pgTable\("([^"]+)", \{/g;
let match;
while ((match = regex.exec(CONTENT)) !== null) {
  matches.push({ name: match[1], table: match[2], start: match.index + match[0].length });
}
if (!matches.length) {
  console.error('No matches found');
  process.exit(1);
}
let output = [];
output.push('import mongoose from "mongoose";');
output.push('import { z } from "zod/v4";');
output.push('import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";');
output.push('');
for (const m of matches) {
  const start = m.start;
  let brace = 1;
  let i = start;
  while (i < CONTENT.length && brace > 0) {
    if (CONTENT[i] === '{') brace++;
    if (CONTENT[i] === '}') brace--;
    i++;
  }
  const body = CONTENT.slice(start, i - 1);
  const fields = parseTableFields(body);
  const schemaName = `${m.name[0].toUpperCase()}${m.name.slice(1)}Schema`;
  output.push(generateSchema(schemaName, fields));
  output.push(`autoIncrementId(${schemaName}, "${m.table}");`);
  output.push(`export const ${m.name} = mongoose.models.${m.name} || mongoose.model("${m.name}", ${schemaName});`);
  output.push('');
}
console.log(output.join('\n'));
