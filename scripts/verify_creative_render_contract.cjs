/** Zero-browser Creative render regression: verifies source context is bound at runtime. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const sourcePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'CreativeDashboardPage.tsx');
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
assert.equal(source.parseDiagnostics.length, 0, 'Creative dashboard has TypeScript parse diagnostics');
const declaration = source.statements.find((statement) =>
  ts.isFunctionDeclaration(statement) && statement.name?.text === 'CreativeSlot');
assert.ok(declaration, 'CreativeSlot component exists');
const js = ts.transpileModule(declaration.getText(source), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = {
  exports: {},
  SectionAnatomy: 'SectionAnatomy',
  require: (specifier) => {
    if (specifier === 'react/jsx-runtime') {
      return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    }
    throw new Error(`Unexpected module: ${specifier}`);
  },
};
vm.runInNewContext(js, sandbox, { timeout: 5000 });
const CreativeSlot = sandbox.exports.CreativeSlot;
assert.equal(typeof CreativeSlot, 'function');
for (const number of [1, 2, 3, 4]) {
  const result = CreativeSlot({ number, title: 'Test section', subtitle: 'Test definition',
    children: 'Creative data', client: 'Union Coop', year: 2026, month: 8 });
  assert.equal(result.props.client, 'Union Coop', 'client source context forwarded');
  assert.equal(result.props.year, 2026, 'year source context forwarded');
  assert.equal(result.props.month, 8, 'month source context forwarded');
  assert.equal(result.props.number, number);
}
assert.ok(sourceText.indexOf('dashboard.isError ?') < sourceText.indexOf('dashboard.isLoading || !dashboard.data'),
  'Creative error handling must precede the loading/no-data fallback');
console.log('PASS: Creative slots 1-4 render with bound client/year/month, and API errors precede loading state.');
