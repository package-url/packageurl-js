const assert = require('assert')

const TEST_FILE = require('./data/test-suite-data.json')

/** @type {import('../src/package-url')} */
const { PackageURL } = require('../src/package-url')

describe('PackageURL', () => {
    it('Benchmarking the library', () => {
        const iterations = 10000
        const data = TEST_FILE.filter((obj) => !obj.is_invalid)
        const { length: dataLength } = data
        const objects = []
        for (let i = 0; i < iterations; i += dataLength) {
            const delta = iterations - (i + dataLength)
            if (delta < 0) {
                objects.push(...data.slice(0, delta))
            } else {
                objects.push(...data)
            }
        }
        const start = Date.now()
        for (let i = 0; i < iterations; i += 1) {
            const obj = objects[i]
            const purl = new PackageURL(
                obj.type,
                obj.namespace,
                obj.name,
                obj.version,
                obj.qualifiers,
                obj.subpath
            )
            PackageURL.fromString(purl.toString())
        }
        const end = Date.now()
        console.log(
            `avg exec time of ${iterations} iterations (in ms): ${
                (end - start) / iterations
            }`
        )
        assert.ok(end - start > 0)
    })
})
