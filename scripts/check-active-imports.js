const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const declaredDeps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

const entry = path.join(root, 'App.js');
const seen = new Set();
const issues = [];

const resolveRelative = (fromFile, source) => {
  const base = path.resolve(path.dirname(fromFile), source);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.js'),
  ];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};

const packageName = (source) => (
  source.startsWith('@') ? source.split('/').slice(0, 2).join('/') : source.split('/')[0]
);

const visit = (file) => {
  if (seen.has(file)) return;
  seen.add(file);

  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  } catch (error) {
    issues.push(`PARSE | ${path.relative(root, file)} | ${error.message}`);
    return;
  }

  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const source = node.source.value;

    if (source.startsWith('.')) {
      const resolved = resolveRelative(file, source);
      if (!resolved) {
        issues.push(`MISSING_REL | ${path.relative(root, file)} | ${source}`);
        continue;
      }
      if (resolved.startsWith(root) && resolved.endsWith('.js')) visit(resolved);
      continue;
    }

    const depName = packageName(source);
    if (!declaredDeps.has(depName) && !['react', 'react-native'].includes(depName)) {
      issues.push(`MISSING_DEP | ${path.relative(root, file)} | ${source}`);
    }
  }
};

visit(entry);

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log(`Active import graph OK (${seen.size} files checked)`);
