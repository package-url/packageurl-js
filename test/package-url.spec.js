/*!
Copyright (c) the purl authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const assert = require('assert')
const { describe, it } = require('mocha')

const npmBuiltinNames = require('../data/npm/builtin-names.json')
const npmLegacyNames = require('../data/npm/legacy-names.json')

const TEST_FILE = [
    ...require('./data/test-suite-data.json'),
    ...require('./data/contrib-tests.json')
]

const { PackageURL } = require('../src/package-url')

function getNpmId(purl) {
    const { name, namespace } = purl
    return `${namespace?.length > 0 ? `${namespace}/` : ''}${name}`
}

describe('PackageURL', function () {
    describe('KnownQualifierNames', function () {
        describe('check access', function () {
            ;[
                ['RepositoryUrl', 'repository_url'],
                ['DownloadUrl', 'download_url'],
                ['VcsUrl', 'vcs_url'],
                ['FileName', 'file_name'],
                ['Checksum', 'checksum']
            ].forEach(function ([name, expectedValue]) {
                it(`maps: ${name} => ${expectedValue}`, function () {
                    assert.strictEqual(
                        PackageURL.KnownQualifierNames[name],
                        expectedValue
                    )
                })
            })
        })

        it('readonly: cannot be written', function () {
            PackageURL.KnownQualifierNames = { foo: 'bar' }
            assert.notDeepStrictEqual(PackageURL.KnownQualifierNames, {
                foo: 'bar'
            })
        })

        it('frozen: cannot be modified', function () {
            PackageURL.KnownQualifierNames.foo = 'bar'
            assert.strictEqual(PackageURL.KnownQualifierNames.foo, undefined)
        })
    })

    describe('constructor', function () {
        const paramMap = {
            type: 0,
            namespace: 1,
            name: 2,
            version: 3,
            qualifiers: 4,
            subpath: 5
        }

        const createArgs = (paramName, value) => {
            const args = [
                'type',
                'namespace',
                'name',
                'version',
                undefined,
                'subpath'
            ]
            args[paramMap[paramName]] = value
            return args
        }

        it('should validate required params', function () {
            const testValid = paramName => {
                const paramIndex = paramMap[paramName]
                const args = createArgs(paramName, paramName)
                const message = JSON.stringify(args[paramIndex])
                try {
                    new PackageURL(...args)
                    assert.ok(true, message)
                } catch {
                    assert.ok(false, message)
                }
            }

            const testInvalid = paramName => {
                const paramIndex = paramMap[paramName]
                ;[
                    createArgs(paramName, 0),
                    createArgs(paramName, false),
                    createArgs(paramName, 1),
                    createArgs(paramName, true),
                    createArgs(paramName, {}),
                    createArgs(paramName, null),
                    createArgs(paramName, undefined),
                    createArgs(paramName, '')
                ].forEach(args => {
                    const message = JSON.stringify(args[paramIndex])
                    try {
                        new PackageURL(...args)
                        assert.ok(false, message)
                    } catch {
                        assert.ok(true, message)
                    }
                })
            }

            ;['type', 'name'].forEach(paramName => {
                testValid(paramName)
                testInvalid(paramName)
            })
        })

        it('should validate string params', function () {
            const testValid = paramName => {
                const paramIndex = paramMap[paramName]
                ;[
                    createArgs(paramName, paramName),
                    createArgs(paramName, null),
                    createArgs(paramName, undefined),
                    createArgs(paramName, '')
                ].forEach(args => {
                    const message = JSON.stringify(args[paramIndex])
                    try {
                        new PackageURL(...args)
                        assert.ok(true, message)
                    } catch {
                        assert.ok(false, message)
                    }
                })
            }

            const testInvalid = paramName => {
                const paramIndex = paramMap[paramName]
                ;[
                    createArgs(paramName, 0),
                    createArgs(paramName, false),
                    createArgs(paramName, 1),
                    createArgs(paramName, true),
                    createArgs(paramName, {})
                ].forEach(args => {
                    const message = JSON.stringify(args[paramIndex])
                    try {
                        new PackageURL(...args)
                        assert.ok(false, message)
                    } catch {
                        assert.ok(true, message)
                    }
                })
            }

            ;['namespace', 'version', 'subpath'].forEach(paramName => {
                testValid(paramName)
                testInvalid(paramName)
            })
        })

        it('should not decode params', () => {
            assert.strictEqual(
                new PackageURL('type', '%21', 'name').toString(),
                'pkg:type/%2521/name'
            )
            assert.strictEqual(
                new PackageURL('type', 'namespace', '%21').toString(),
                'pkg:type/namespace/%2521'
            )
            assert.strictEqual(
                new PackageURL('type', 'namespace', 'name', '%21').toString(),
                'pkg:type/namespace/name@%2521'
            )
            assert.strictEqual(
                new PackageURL('type', 'namespace', 'name', '1.0', {
                    a: '%21'
                }).toString(),
                'pkg:type/namespace/name@1.0?a=%2521'
            )
            assert.strictEqual(
                new PackageURL(
                    'type',
                    'namespace',
                    'name',
                    '1.0',
                    'a=%2521'
                ).toString(),
                'pkg:type/namespace/name@1.0?a=%2521'
            )
            assert.strictEqual(
                new PackageURL(
                    'type',
                    'namespace',
                    'name',
                    '1.0',
                    null,
                    '%21'
                ).toString(),
                'pkg:type/namespace/name@1.0#%2521'
            )
        })
    })

    describe('toString()', function () {
        it('type is validated', function () {
            ;['ty#pe', 'ty@pe', 'ty/pe', '1type'].forEach(type => {
                assert.throws(
                    () => new PackageURL(type, undefined, 'name'),
                    /contains an illegal character|cannot start with a number/
                )
            })
        })

        it('encode #', function () {
            /* The # is a delimiter between url and subpath. */
            const purl = new PackageURL(
                'type',
                'name#space',
                'na#me',
                'ver#sion',
                { foo: 'bar#baz' },
                'sub#path'
            )
            assert.strictEqual(
                purl.toString(),
                'pkg:type/name%23space/na%23me@ver%23sion?foo=bar%23baz#sub%23path'
            )
        })

        it('encode @', function () {
            /* The @ is a delimiter between package name and version. */
            const purl = new PackageURL(
                'type',
                'name@space',
                'na@me',
                'ver@sion',
                { foo: 'bar@baz' },
                'sub@path'
            )
            assert.strictEqual(
                purl.toString(),
                'pkg:type/name%40space/na%40me@ver%40sion?foo=bar%40baz#sub%40path'
            )
        })

        it('path components encode /', function () {
            /* only namespace is allowed to have multiple segments separated by `/`` */
            const purl = new PackageURL(
                'type',
                'namespace1/namespace2',
                'na/me'
            )
            assert.strictEqual(
                purl.toString(),
                'pkg:type/namespace1/namespace2/na%2Fme'
            )
        })
    })

    describe('fromString()', function () {
        it('with qualifiers.checksums', function () {
            const purlString =
                'pkg:npm/packageurl-js@0.0.7?checksums=sha512:b9c27369720d948829a98118e9a35fd09d9018711e30dc2df5f8ae85bb19b2ade4679351c4d96768451ee9e841e5f5a36114a9ef98f4fe5256a5f4ca981736a0'
            const purl = PackageURL.fromString(purlString)

            assert.strictEqual(purl.type, 'npm')
            assert.strictEqual(purl.namespace, undefined)
            assert.strictEqual(purl.name, 'packageurl-js')
            assert.strictEqual(purl.version, '0.0.7')
            assert.deepStrictEqual(purl.qualifiers, {
                __proto__: null,
                checksums:
                    'sha512:b9c27369720d948829a98118e9a35fd09d9018711e30dc2df5f8ae85bb19b2ade4679351c4d96768451ee9e841e5f5a36114a9ef98f4fe5256a5f4ca981736a0'
            })
        })

        it('with qualifiers.vcs_url', function () {
            const purlString =
                'pkg:npm/packageurl-js@0.0.7?vcs_url=git%2Bhttps%3A%2F%2Fgithub.com%2Fpackage-url%2Fpackageurl-js.git'
            const purl = PackageURL.fromString(purlString)

            assert.strictEqual(purl.type, 'npm')
            assert.strictEqual(purl.namespace, undefined)
            assert.strictEqual(purl.name, 'packageurl-js')
            assert.strictEqual(purl.version, '0.0.7')
            assert.deepStrictEqual(purl.qualifiers, {
                __proto__: null,
                vcs_url: 'git+https://github.com/package-url/packageurl-js.git'
            })
        })

        it('npm PURL with namespace starting with @', function () {
            const purlString = 'pkg:npm/@aws-crypto/crc32@3.0.0'
            const purl = PackageURL.fromString(purlString)

            assert.strictEqual(purl.type, 'npm')
            assert.strictEqual(purl.namespace, '@aws-crypto')
            assert.strictEqual(purl.name, 'crc32')
            assert.strictEqual(purl.version, '3.0.0')
        })

        it('namespace with multiple segments', function () {
            const purl = PackageURL.fromString(
                'pkg:type/namespace1/namespace2/na%2Fme'
            )
            assert.strictEqual(purl.type, 'type')
            assert.strictEqual(purl.namespace, 'namespace1/namespace2')
            assert.strictEqual(purl.name, 'na/me')
        })

        it('encoded #', function () {
            const purl = PackageURL.fromString(
                'pkg:type/name%23space/na%23me@ver%23sion?foo=bar%23baz#sub%23path'
            )
            assert.strictEqual(purl.type, 'type')
            assert.strictEqual(purl.namespace, 'name#space')
            assert.strictEqual(purl.name, 'na#me')
            assert.strictEqual(purl.version, 'ver#sion')
            assert.deepStrictEqual(purl.qualifiers, {
                __proto__: null,
                foo: 'bar#baz'
            })
            assert.strictEqual(purl.subpath, 'sub#path')
        })

        it('encoded @', function () {
            const purl = PackageURL.fromString(
                'pkg:type/name%40space/na%40me@ver%40sion?foo=bar%40baz#sub%40path'
            )
            assert.strictEqual(purl.type, 'type')
            assert.strictEqual(purl.namespace, 'name@space')
            assert.strictEqual(purl.name, 'na@me')
            assert.strictEqual(purl.version, 'ver@sion')
            assert.deepStrictEqual(purl.qualifiers, {
                __proto__: null,
                foo: 'bar@baz'
            })
            assert.strictEqual(purl.subpath, 'sub@path')
        })

        it('should error on decode failures', () => {
            assert.throws(
                () => PackageURL.fromString('pkg:type/100%/name'),
                /unable to decode "namespace" component/
            )
            assert.throws(
                () => PackageURL.fromString('pkg:type/namespace/100%'),
                /unable to decode "name" component/
            )
            assert.throws(
                () => PackageURL.fromString('pkg:type/namespace/name@100%'),
                /unable to decode "version" component/
            )
            assert.throws(
                () =>
                    PackageURL.fromString('pkg:type/namespace/name@1.0?a=100%'),
                /unable to decode "qualifiers" component/
            )
            assert.throws(
                () => PackageURL.fromString('pkg:type/namespace/name@1.0#100%'),
                /unable to decode "subpath" component/
            )
        })
    })

    describe('test-suite-data', function () {
        TEST_FILE.forEach(function (obj) {
            describe(obj.description, function () {
                if (obj.is_invalid) {
                    it(`should not be possible to create invalid ${obj.type} PackageURLs`, function () {
                        assert.throws(
                            () =>
                                new PackageURL(
                                    obj.type,
                                    obj.namespace,
                                    obj.name,
                                    obj.version,
                                    obj.qualifiers,
                                    obj.subpath
                                ),
                            /is a required|Invalid purl/
                        )
                    })
                    it(`should not be possible to parse invalid ${obj.type} PackageURLs`, function () {
                        assert.throws(
                            () => PackageURL.fromString(obj.purl),
                            /missing the required|Invalid purl/
                        )
                    })
                } else {
                    it(`should be able to create valid ${obj.type} PackageURLs`, function () {
                        const purl = new PackageURL(
                            obj.type,
                            obj.namespace,
                            obj.name,
                            obj.version,
                            obj.qualifiers,
                            obj.subpath
                        )
                        assert.strictEqual(purl.type, obj.type)
                        assert.strictEqual(purl.name, obj.name)
                        assert.strictEqual(
                            purl.namespace,
                            obj.namespace ?? undefined
                        )
                        assert.strictEqual(
                            purl.version,
                            obj.version ?? undefined
                        )
                        assert.deepStrictEqual(
                            purl.qualifiers,
                            obj.qualifiers
                                ? { __proto__: null, ...obj.qualifiers }
                                : undefined
                        )
                        assert.strictEqual(
                            purl.subpath,
                            obj.subpath ?? undefined
                        )
                    })
                    it(`should be able to convert valid ${obj.type} PackageURLs to a string`, function () {
                        const purl = new PackageURL(
                            obj.type,
                            obj.namespace,
                            obj.name,
                            obj.version,
                            obj.qualifiers,
                            obj.subpath
                        )
                        assert.strictEqual(purl.toString(), obj.canonical_purl)
                    })
                    it(`should be able to parse valid ${obj.type} PackageURLs`, function () {
                        const purl = PackageURL.fromString(obj.purl)
                        assert.strictEqual(purl.toString(), obj.canonical_purl)
                        assert.strictEqual(purl.type, obj.type)
                        assert.strictEqual(purl.name, obj.name)
                        assert.strictEqual(
                            purl.namespace,
                            obj.namespace ?? undefined
                        )
                        assert.strictEqual(
                            purl.version,
                            obj.version ?? undefined
                        )
                        assert.deepStrictEqual(
                            purl.qualifiers,
                            obj.qualifiers
                                ? { __proto__: null, ...obj.qualifiers }
                                : undefined
                        )
                        assert.strictEqual(
                            purl.subpath,
                            obj.subpath ?? undefined
                        )
                    })
                }
            })
        })
    })

    describe('npm', function () {
        it("should allow legacy names to be mixed case, match a builtin, or contain ~'!()* characters", function () {
            for (const legacyName of npmLegacyNames) {
                let purl
                assert.doesNotThrow(() => {
                    const parts = legacyName.split('/')
                    const namespace = parts.length > 1 ? parts[0] : ''
                    const name = parts.at(-1)
                    purl = new PackageURL('npm', namespace, name)
                })
                const id = purl ? getNpmId(purl) : ''
                const isBuiltin = npmBuiltinNames.includes(id)
                const isMixedCased = /[A-Z]/.test(id)
                const containsIllegalCharacters = /[~'!()*]/.test(id)
                assert.ok(
                    isBuiltin || isMixedCased || containsIllegalCharacters,
                    `assert for ${legacyName}`
                )
            }
        })
        it('should not allow non-legacy builtin names', function () {
            for (const builtinName of npmBuiltinNames) {
                if (!npmLegacyNames.includes(builtinName)) {
                    assert.throws(() => {
                        const parts = builtinName.split('/')
                        const namespace = parts.length > 1 ? parts[0] : ''
                        const name = parts.at(-1)
                        new PackageURL('npm', namespace, name)
                    }, `assert for ${builtinName}`)
                }
            }
        })
    })

    describe('pub', function () {
        it('should normalize dashes to underscores', function () {
            const purlWithDashes = new PackageURL(
                'pub',
                '',
                'flutter-downloader',
                '1.0.0'
            )
            assert.strictEqual(
                purlWithDashes.toString(),
                'pkg:pub/flutter_downloader@1.0.0'
            )
        })
    })

    describe('pypi', function () {
        it('should handle pypi package-urls per the purl-spec', function () {
            const purlMixedCasing = PackageURL.fromString(
                'pkg:pypi/PYYaml@5.3.0'
            )
            assert.strictEqual(
                purlMixedCasing.toString(),
                'pkg:pypi/pyyaml@5.3.0'
            )
            const purlWithUnderscore = PackageURL.fromString(
                'pkg:pypi/typing_extensions_blah@1.0.0'
            )
            assert.strictEqual(
                purlWithUnderscore.toString(),
                'pkg:pypi/typing-extensions-blah@1.0.0'
            )
        })
    })
})
