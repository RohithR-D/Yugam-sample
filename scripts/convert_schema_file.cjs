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

const ZOD_TYPE_MAP = {
  serial: 'z.number()',
  integer: 'z.number()',
  numeric: 'z.number()',
  varchar: 'z.string()',
  text: 'z.string()',
  boolean: 'z.boolean()',
  timestamp: 'z.union([z.string(), z.date()])',
  jsonb: 'z.any()',
};

const content = fs.readFileSync(process.argv[2], 'utf8');

function parseTables(text) {
  const tables = [];
  const regex = /export const ([a-zA-Z0-9_]+) = pgTable\("([^"]+)", \{/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const tableName = match[2];
    let pos = match.index + match[0].length;
    let brace = 1;
    while (pos < text.length && brace > 0) {
      if (text[pos] === '{') brace++;
      if (text[pos] === '}') brace--;
      pos++;
    }
    const body = text.slice(match.index + match[0].length, pos - 1);
    tables.push({ name, tableName, body });
  }
  return tables;
}

function parseFields(body) {
  const fields = [];
  body.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;
    const m = trimmed.match(/^([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_]+)\(([^)]*)\)(.*),?$/);
    if (!m) return;
    const [, name, type, args, tail] = m;
    const options = {
      required: tail.includes('notNull()'),
      defaultNow: tail.includes('defaultNow()'),
      defaultRaw: null,
    };
    const defaultMatch = tail.match(/default\(([^)]+)\)/);
    if (defaultMatch && !options.defaultNow) {
      options.defaultRaw = defaultMatch[1].trim();
    }
    fields.push({ name, type, options });
  });
  return fields;
}

function parseInsertSchema(text) {
  const regex = /export const ([a-zA-Z0-9_]+) = createInsertSchema\([^\)]+\)\.omit\(\{([^\}]+)\}\)(?:\.extend\(\{([\s\S]*?)\}\))?;/g;
  const match = regex.exec(text);
  if (!match) return null;
  const name = match[1];
  const omitBody = match[2];
  const extendBody = match[3];
  const omitted = [];
  omitBody.split(/,\s*/).forEach((part) => {
    const m = part.match(/([a-zA-Z0-9_]+):\s*true/);
    if (m) omitted.push(m[1]);
  });
  return { name, omitted, extendBody };
}

function generateSchema(tableName, fields) {
  const lines = ['const ' + tableName + 'Schema = createMongoSchema({'];
  fields.forEach((field) => {
    const typeExpr = TYPE_MAP[field.type] || 'String';
    const props = [`type: ${typeExpr}`];
    if (field.name === 'id') {
      props.push('unique: true', 'index: true');
    }
    if (field.options.required) props.push('required: true');
    if (field.options.defaultNow) props.push('default: Date.now');
    if (field.options.defaultRaw) {
      const raw = field.options.defaultRaw;
      if (/^['"].*['"]$/.test(raw) || /^[0-9.-]+$/.test(raw) || /^(true|false)$/.test(raw)) {
        props.push(`default: ${raw}`);
      } else {
        props.push(`default: ${raw}`);
      }
    }
    lines.push(`  ${field.name}: { ${props.join(', ')} },`);
  });
  lines.push('});');
  return lines.join('\n');
}

function generateInsertSchema(insertName, fields, omitted, extendBody) {
  const lines = [`export const ${insertName} = z.object({`];
  fields
    .filter((field) => !omitted.includes(field.name))
    .forEach((field) => {
      const baseType = ZOD_TYPE_MAP[field.type] || 'z.string()';
      const required = field.options.required && field.name !== 'createdAt';
      const schemaExpr = required ? baseType : `${baseType}.optional()`;
      lines.push(`  ${field.name}: ${schemaExpr},`);
    });
  lines.push('});');
  if (extendBody) {
    lines.push(`export const ${insertName}Extended = ${insertName}.extend({${extendBody}});`);
    lines.push(`export const ${insertName} = ${insertName}Extended;`);
  }
  return lines.join('\n');
}

const tables = parseTables(content);
if (!tables.length) {
  console.error('No tables found in', process.argv[2]);
  process.exit(1);
}
const insertSchema = parseInsertSchema(content);

const fileLines = [];
fileLines.push('import mongoose from "mongoose";');
fileLines.push('import { z } from "zod/v4";');
fileLines.push('import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";');
fileLines.push('');
for (const table of tables) {
  const fields = parseFields(table.body);
  const schemaName = `${table.name[0].toUpperCase()}${table.name.slice(1)}Schema`;
  fileLines.push(generateSchema(schemaName, fields));
  fileLines.push(`autoIncrementId(${schemaName}, "${table.tableName}");`);
  fileLines.push(`export const ${table.name} = mongoose.models.${table.name} || mongoose.model("${table.name}", ${schemaName});`);
  fileLines.push('');
}
if (insertSchema) {
  const baseTable = tables[0];
  const fields = parseFields(baseTable.body);
  const schemaCode = generateInsertSchema(insertSchema.name, fields, insertSchema.omitted, insertSchema.extendBody);
  fileLines.push(schemaCode);
  fileLines.push(`export type ${insertSchema.name === 'insertContractSchema' ? 'InsertContract' : 'Insert' + insertSchema.name.slice(6)} = z.infer<typeof ${insertSchema.name}>;`);
}

console.log(fileLines.join('\n'));
