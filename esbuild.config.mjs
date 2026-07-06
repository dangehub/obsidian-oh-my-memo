import esbuild from 'esbuild';
import process from 'process';
import { builtinModules } from 'node:module';

const banner = `/* obsidian-quick-memo */`;
const prod = process.argv[2] === 'production';
const watch = process.argv.includes('--watch');

const context = await esbuild.context({
  banner: { js: banner },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', ...builtinModules],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
});

if (watch) {
  await context.watch();
  console.log('watching...');
} else {
  await context.rebuild();
  await context.dispose();
}
