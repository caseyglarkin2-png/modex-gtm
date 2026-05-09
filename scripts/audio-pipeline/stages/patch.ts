import ts from 'typescript';
import type { AccountAudioBrief } from '@/lib/microsites/schema';

export interface PatchInput {
  /** Full TypeScript source of the accounts/<slug>.ts file. */
  source: string;
  /** New brief to write. */
  brief: AccountAudioBrief;
}

/**
 * Edit an account file's exported AccountMicrositeData constant to add or
 * replace its `audioBrief` property. Uses the TypeScript compiler API to
 * LOCATE the relevant character range in the source, then performs a
 * surgical text edit that preserves the rest of the file byte-for-byte —
 * existing comments, imports, helpers, formatting, and other properties
 * are untouched. Only the audioBrief block is newly written.
 *
 * Throws if the source doesn't contain an exported `AccountMicrositeData`
 * constant whose initializer is an object literal — fail loud rather than
 * corrupt the file.
 */
export function patchAccountFile(input: PatchInput): string {
  const { source, brief } = input;
  const sf = ts.createSourceFile('account.ts', source, ts.ScriptTarget.Latest, true);

  const accountConst = sf.statements.find(
    (s): s is ts.VariableStatement =>
      ts.isVariableStatement(s) &&
      !!s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      s.declarationList.declarations.length === 1 &&
      isAccountTyped(s.declarationList.declarations[0]),
  );
  if (!accountConst) {
    throw new Error('patchAccountFile: no exported AccountMicrositeData constant found');
  }
  const decl = accountConst.declarationList.declarations[0];
  const init = decl.initializer;
  if (!init || !ts.isObjectLiteralExpression(init)) {
    throw new Error('patchAccountFile: account constant initializer is not an object literal');
  }

  const existing = init.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'audioBrief',
  );

  const audioBriefText = renderAudioBrief(brief, '  ');

  if (existing) {
    // Replace mode: find the full character range of the existing property.
    // getStart() skips leading trivia; getFullStart() includes it.
    // We want to replace from just after the previous token up to the end of this property
    // (including any trailing comma). We'll use getStart() for the property start and
    // walk backward over horizontal whitespace to cover the indentation.
    let start = existing.getStart(sf);
    let end = existing.getEnd();
    // Include trailing comma if present.
    if (source[end] === ',') end += 1;
    // Walk backward over horizontal whitespace (space/tab) within the same line
    // so we replace the property's leading indentation cleanly.
    while (start > 0 && (source[start - 1] === ' ' || source[start - 1] === '\t')) start -= 1;
    return source.slice(0, start) + '  ' + audioBriefText + source.slice(end);
  }

  // Insert mode: place the new property just before the object literal's closing brace.
  // init.getEnd() - 1 gives us the index of the closing `}`.
  const closingBracePos = init.getEnd() - 1;
  if (source[closingBracePos] !== '}') {
    throw new Error('patchAccountFile: could not locate object literal closing brace');
  }

  // Walk backward over whitespace to find the last non-whitespace character.
  let cursor = closingBracePos - 1;
  while (cursor > 0 && /\s/.test(source[cursor])) cursor -= 1;
  const lastNonWs = source[cursor];
  const needsCommaOnPrev = lastNonWs !== ',' && lastNonWs !== '{';
  const trailingComma = needsCommaOnPrev ? ',\n' : '\n';

  const insertion = `${trailingComma}  ${audioBriefText}\n`;
  return source.slice(0, cursor + 1) + insertion + source.slice(cursor + 1);
}

function isAccountTyped(d: ts.VariableDeclaration): boolean {
  if (!d.type || !ts.isTypeReferenceNode(d.type)) return false;
  return ts.isIdentifier(d.type.typeName) && d.type.typeName.text === 'AccountMicrositeData';
}

/**
 * Render the audioBrief property as a multi-line TypeScript object-literal
 * fragment. The first line ("audioBrief: {") has NO leading indent — caller
 * provides the indent at the splice point. Subsequent lines are indented
 * by `baseIndent + '  '` for nested fields.
 */
function renderAudioBrief(brief: AccountAudioBrief, baseIndent: string): string {
  const inner = baseIndent + '  ';
  const lines: string[] = [];
  lines.push('audioBrief: {');
  lines.push(`${inner}src: ${q(brief.src)},`);
  lines.push(`${inner}chapters: [`);
  for (const c of brief.chapters) {
    lines.push(`${inner}  { id: ${q(c.id)}, label: ${q(c.label)}, start: ${c.start} },`);
  }
  lines.push(`${inner}],`);
  if (brief.heading !== undefined) lines.push(`${inner}heading: ${q(brief.heading)},`);
  if (brief.intro !== undefined) lines.push(`${inner}intro: ${q(brief.intro)},`);
  lines.push(`${inner}generatedAt: ${q(brief.generatedAt)},`);
  lines.push(`${baseIndent}}`);
  return lines.join('\n');
}

function q(s: string): string {
  // Single-quoted with backslash-escapes for embedded quotes / newlines / backslashes.
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}
