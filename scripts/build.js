import minimist from 'minimist';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';



//命令行参数
const args = minimist(process.argv.slice(2));
//获取文件绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url)
//打包哪个项目
const file_name = [
    'shared',
    'waterfall-virtual-list'
]
const target = args._[0] || file_name[0];
//打包模式

//入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`)

const outputOptions = [
    {
        file: resolve(__dirname, `../packages/${target}/dist/${target}.global.js`),
        format: 'iife',
        name: pkg.buildOptions?.name
    },
    {
        file: resolve(__dirname, `../packages/${target}/dist/${target}.global.min.js`),
        format: 'iife',
        name: pkg.buildOptions?.name,
        plugins: [terser()]
    },
    {
        file: resolve(__dirname, `../packages/${target}/dist/${target}.esm-bundler.min.js`),
        format: 'esm',
        name: pkg.buildOptions?.name,
        plugins: [terser()]
    },
    {
        file: resolve(__dirname, `../packages/${target}/dist/${target}.esm-bundler.js`),
        format: 'esm',
        name: pkg.buildOptions?.name
    }
]

export default {
    input: entry,
    output: outputOptions,
    plugins: [
        typescript() // 加上这个才能正确解析 .ts 文件
    ]
}