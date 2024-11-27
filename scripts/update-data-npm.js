'use strict'

const minNodeMajor = 23
const nodeMajor = Number(process.version.slice(1, process.version.indexOf('.')))
if (nodeMajor < minNodeMajor) {
    console.error(
        `✘ Node ${nodeMajor} is not supported. Requires >=${minNodeMajor}.`
    )
    process.exitCode = 1
    return
}

const fs = require('node:fs/promises')
const path = require('node:path')
const Module = require('node:module')

const pacote = require('pacote')
const validateNpmPackageName = require('validate-npm-package-name')
const { default: yoctoSpinner } = require('yocto-spinner')

const rootPath = path.resolve(__dirname, '..')
const dataPath = path.join(rootPath, 'data')
const npmDataPath = path.join(dataPath, 'npm')
const npmBuiltinNamesJsonPath = path.join(npmDataPath, 'builtin-names.json')
const npmLegacyNamesJsonPath = path.join(npmDataPath, 'legacy-names.json')

const { compare: alphanumericComparator } = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
})

function arrayChunk(arr, size = 2) {
    const { length } = arr
    const chunkSize = Math.min(length, size)
    const chunks = []
    for (let i = 0; i < length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize))
    }
    return chunks
}

async function pFilter(array, concurrency, callbackFn, options) {
    return (
        await pFilterChunk(arrayChunk(array, concurrency), callbackFn, options)
    ).flat()
}

async function pFilterChunk(chunks, callbackFn, options) {
    const { retries = 0, signal } = { __proto__: null, ...options }
    const { length } = chunks
    const filteredChunks = Array(length)
    for (let i = 0; i < length; i += 1) {
        // Process each chunk, filtering based on the callback function.
        if (signal?.aborted) {
            filteredChunks[i] = []
        } else {
            const chunk = chunks[i]
            const predicateResults = await Promise.all(
                chunk.map(value => {
                    if (signal?.aborted) {
                        return Promise.resolve()
                    }
                    if (retries === 0) {
                        return callbackFn(value, { signal })
                    }
                    let attempts = retries
                    return (async () => {
                        while (attempts-- >= 0) {
                            if (await callbackFn(value, { signal })) {
                                return true
                            }
                        }
                        return false
                    })()
                })
            )
            filteredChunks[i] = chunk.filter((_v, i) => predicateResults[i])
        }
    }
    return filteredChunks
}

void (async () => {
    const spinner = yoctoSpinner().start()
    const builtinNames = Module.builtinModules.toSorted(alphanumericComparator)
    const allThePackageNames = [
        ...new Set([
            // Load the 43.1MB names.json file of 'all-the-package-names@2.0.0'
            // which keeps the json file smaller while still covering the changes from:
            // https://blog.npmjs.org/post/168978377570/new-package-moniker-rules.html
            ...require('all-the-package-names/names.json'),
            // Load the 24.7MB names.json from 'all-the-package-names@1.3905.0',
            // the last v1 release, because it has different names resolved by
            // npm's replicate.npmjs.com service.
            ...require('all-the-package-names-v1.3905.0/names.json')
        ])
    ]
    const rawLegacyNames = allThePackageNames
        .filter(n => !validateNpmPackageName(n).validForNewPackages)
        .sort(alphanumericComparator)
    const seenNames = new Set()
    const invalidNames = new Set()
    const legacyNames =
        // Chunk package names to process them in parallel 3 at a time.
        await pFilter(
            rawLegacyNames,
            3,
            async n => {
                if (!seenNames.has(n)) {
                    seenNames.add(n)
                    spinner.text = `Checking package ${n}...`
                }
                try {
                    await pacote.manifest(`${n}@latest`)
                    invalidNames.delete(n)
                    return true
                } catch {
                    invalidNames.add(n)
                }
                return false
            },
            { retries: 3 }
        )
    spinner.text = 'Writing json files...'
    await Promise.all(
        [
            { json: builtinNames, path: npmBuiltinNamesJsonPath },
            { json: legacyNames, path: npmLegacyNamesJsonPath }
        ].map(d =>
            fs.writeFile(d.path, `${JSON.stringify(d.json, null, 2)}\n`, 'utf8')
        )
    )
    spinner.stop()
    if (invalidNames.size) {
        console.log(`⚠️ Removed missing packages:`, [...invalidNames])
    }
})()
