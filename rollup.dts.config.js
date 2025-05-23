// @ts-check
import assert from 'node:assert/strict'
import { parse } from '@babel/parser'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import MagicString from 'magic-string'
import dts from 'rollup-plugin-dts'


if (!existsSync('temp/packages')) {
    console.warn(
        'no temp dts files found. run `tsc -p tsconfig.build-browser.json && tsc -p tsconfig.build-node.json` first.',
    )
    process.exit(1)
}

const packages = readdirSync('temp/packages')
const targets = process.env.TARGETS ? process.env.TARGETS.split(',') : null
const targetPackages = targets
    ? packages.filter(pkg => targets.includes(pkg))
    : packages

    
export default targetPackages.map(pkg => {
    return {
        input: `./temp/packages/${pkg}/src/index.d.ts`,
        output: {
            file: `packages/${pkg}/dist/${pkg}.d.ts`,
            format: 'es',
        },
        plugins: [dts(), patchTypes(pkg)],
        onwarn(warning, warn) {
            // during dts rollup, everything is externalized by default
            if (
                warning.code === 'UNRESOLVED_IMPORT' &&
                !warning.exporter?.startsWith('.')
            ) {
                return
            }
            warn(warning)
        }
    }
})


function patchTypes(pkg) {
    return {
        name: 'patch-types',
        renderChunk(code, chunk) {
            const s = new MagicString(code)
            const ast = parse(code, {
                plugins: ['typescript'],
                sourceType: 'module',
            })

            /**
             * @param {import('@babel/types').VariableDeclarator | import('@babel/types').TSTypeAliasDeclaration | import('@babel/types').TSInterfaceDeclaration | import('@babel/types').TSDeclareFunction | import('@babel/types').TSInterfaceDeclaration | import('@babel/types').TSEnumDeclaration | import('@babel/types').ClassDeclaration} node
             * @param {import('@babel/types').VariableDeclaration} [parentDecl]
             */
            function processDeclaration(node, parentDecl) {
                if (!node.id) {
                    return
                }
                assert(node.id.type === 'Identifier')
                const name = node.id.name
                if (name.startsWith('_')) {
                    return
                }
                shouldRemoveExport.add(name)
                if (isExported.has(name)) {
                    const start = (parentDecl || node).start
                    assert(typeof start === 'number')
                    s.prependLeft(start, `export `)
                }
            }

            const isExported = new Set()
            const shouldRemoveExport = new Set()

            // pass 0: check all exported types
            for (const node of ast.program.body) {
                if (node.type === 'ExportNamedDeclaration' && !node.source) {
                    for (let i = 0; i < node.specifiers.length; i++) {
                        const spec = node.specifiers[i]
                        if (spec.type === 'ExportSpecifier') {
                            isExported.add(spec.local.name)
                        }
                    }
                }
            }

            // pass 1: add exports
            for (const node of ast.program.body) {
                if (node.type === 'VariableDeclaration') {
                    processDeclaration(node.declarations[0], node)
                    if (node.declarations.length > 1) {
                        assert(typeof node.start === 'number')
                        assert(typeof node.end === 'number')
                        throw new Error(
                            `unhandled declare const with more than one declarators:\n${code.slice(
                                node.start,
                                node.end,
                            )}`,
                        )
                    }
                } else if (
                    node.type === 'TSTypeAliasDeclaration' ||
                    node.type === 'TSInterfaceDeclaration' ||
                    node.type === 'TSDeclareFunction' ||
                    node.type === 'TSEnumDeclaration' ||
                    node.type === 'ClassDeclaration'
                ) {
                    processDeclaration(node)
                }
            }

            // pass 2: remove exports
            for (const node of ast.program.body) {
                if (node.type === 'ExportNamedDeclaration' && !node.source) {
                    let removed = 0
                    for (let i = 0; i < node.specifiers.length; i++) {
                        const spec = node.specifiers[i]
                        if (
                            spec.type === 'ExportSpecifier' &&
                            shouldRemoveExport.has(spec.local.name)
                        ) {
                            assert(spec.exported.type === 'Identifier')
                            const exported = spec.exported.name
                            if (exported !== spec.local.name) {
                                // this only happens if we have something like
                                //   type Foo
                                //   export { Foo as Bar }
                                continue
                            }
                            const next = node.specifiers[i + 1]
                            if (next) {
                                assert(typeof spec.start === 'number')
                                assert(typeof next.start === 'number')
                                s.remove(spec.start, next.start)
                            } else {
                                // last one
                                const prev = node.specifiers[i - 1]
                                assert(typeof spec.start === 'number')
                                assert(typeof spec.end === 'number')
                                s.remove(
                                    prev
                                        ? (assert(typeof prev.end === 'number'), prev.end)
                                        : spec.start,
                                    spec.end,
                                )
                            }
                            removed++
                        }
                    }
                    if (removed === node.specifiers.length) {
                        assert(typeof node.start === 'number')
                        assert(typeof node.end === 'number')
                        s.remove(node.start, node.end)
                    }
                }
            }
            code = s.toString()

            // append pkg specific types
            const additionalTypeDir = `packages/${pkg}/types`
            if (existsSync(additionalTypeDir)) {
                code +=
                    '\n' +
                    readdirSync(additionalTypeDir)
                        .map(file => readFileSync(`${additionalTypeDir}/${file}`, 'utf-8'))
                        .join('\n')
            }
            return code
        },
    }
}