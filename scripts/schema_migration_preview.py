import re
from pathlib import Path

TYPE_MAP = {
    'serial': 'Number',
    'integer': 'Number',
    'numeric': 'Number',
    'varchar': 'String',
    'text': 'String',
    'boolean': 'Boolean',
    'timestamp': 'Date',
    'jsonb': 'mongoose.Schema.Types.Mixed',
}


def parse_table_fields(table_body):
    fields = []
    for line in table_body.splitlines():
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        m = re.match(r'([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_]+)\(([^)]*)\)(.*),?$', line)
        if not m:
            continue
        name, type_name, type_args, tail = m.groups()
        options = {}
        if 'notNull()' in tail:
            options['required'] = True
        if 'defaultNow()' in tail:
            options['default'] = 'Date.now'
        default_match = re.search(r'default\(([^)]+)\)', tail)
        if default_match and 'defaultNow()' not in tail:
            default_val = default_match.group(1).strip()
            if default_val in ['true','false']:
                options['default'] = default_val
            elif re.match(r'^[0-9.-]+$', default_val):
                options['default'] = default_val
            else:
                options['default'] = default_val
        type_expr = TYPE_MAP.get(type_name, 'String')
        fields.append((name, type_expr, options))
    return fields


def generate_mongoose_schema(table_name, fields):
    lines = ['{']
    for name, type_expr, options in fields:
        opts = []
        if type_expr == 'mongoose.Schema.Types.Mixed':
            opts.append(f'type: {type_expr}')
        else:
            opts.append(f'type: {type_expr}')
        if options.get('required'):
            opts.append('required: true')
        if 'default' in options:
            default_val = options['default']
            if default_val == 'Date.now':
                opts.append('default: Date.now')
            else:
                opts.append(f'default: {default_val}')
        if name == 'id':
            opts.append('unique: true')
            opts.append('index: true')
        line = f'  {name}: {{ {", ".join(opts)} }},'
        lines.append(line)
    lines.append('}')
    return '\n'.join(lines)


def convert_file(path):
    text = Path(path).read_text()
    matches = list(re.finditer(r'export const ([a-zA-Z0-9_]+) = pgTable\("([^"]+)", \{', text))
    if not matches:
        return None
    output = []
    output.append('import mongoose from "mongoose";')
    output.append('import { z } from "zod/v4";')
    output.append('import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";')
    output.append('')
    idx = 0
    for match in matches:
        name = match.group(1)
        table = match.group(2)
        start = match.end()
        brace = 1
        i = start
        while i < len(text) and brace > 0:
            if text[i] == '{': brace += 1
            elif text[i] == '}': brace -= 1
            i += 1
        body = text[start:i-1]
        fields = parse_table_fields(body)
        schema_name = f'{name[0].upper()}{name[1:]}Schema'
        output.append(f'const {schema_name} = createMongoSchema(')
        output.append(generate_mongoose_schema(name, fields))
        output.append(');')
        if name == 'employeesTable':
            output.append('autoIncrementId(' + schema_name + ', "employees");')
        else:
            output.append(f'autoIncrementId({schema_name}, "{table}");')
        output.append(f'export const {name} = mongoose.models.{name} || mongoose.model("{name}", {schema_name});')
        output.append('')
    return '\n'.join(output)

if __name__ == '__main__':
    import sys
    path = sys.argv[1]
    print(convert_file(path))
