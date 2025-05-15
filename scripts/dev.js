import minimist from 'minimist';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import esbuild from 'esbuild'


//命令行参数
const args = minimist(process.argv.slice(2));
//获取文件绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url)
//打包哪个项目
const target = args._[0] || 'waterfall-virtual-list';
//打包模式
const format = args.f || 'iife';

//入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`)


//根据需要打包
esbuild.context({
    entryPoints: [entry],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true,
    platform: 'browser',//打包给浏览器使用
    sourcemap: true,
    format,
    globalName: pkg.buildOptions?.name
}).then((ctx) => {
    console.log('start dev')
    return ctx.watch();//监控入口文件持续打包
});