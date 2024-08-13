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
'use strict'

const {
    encodeNamespace,
    encodeVersion,
    encodeQualifiers,
    encodeQualifierValue,
    encodeSubpath,
    encodeURIComponent
} = require('./encode')

const { isNullishOrEmptyString } = require('./lang')

const {
    normalizeName,
    normalizeNamespace,
    normalizeQualifiers,
    normalizeSubpath,
    normalizeType,
    normalizeVersion
} = require('./normalize')

const { isObject, recursiveFreeze } = require('./objects')

const {
    isBlank,
    isNonEmptyString,
    isSemverString,
    lowerName,
    lowerNamespace,
    lowerVersion,
    replaceDashesWithUnderscores,
    replaceUnderscoresWithDashes,
    trimLeadingSlashes
} = require('./strings')

const {
    validateEmptyByType,
    validateName,
    validateNamespace,
    validateQualifiers,
    validateQualifierKey,
    validateRequiredByType,
    validateSubpath,
    validateType,
    validateVersion
} = require('./validate')

const PurlComponentEncoder = (comp) =>
    typeof comp === 'string' && comp.length ? encodeURIComponent(comp) : ''

const PurlComponentStringNormalizer = (comp) =>
    typeof comp === 'string' ? comp : undefined

const PurlComponentValidator = (_comp, _throws) => true

const PurlTypNormalizer = (purl) => purl

const PurlTypeValidator = (_purl, _throws) => true

// Rules for each purl component:
// https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component
const Component = createHelpersNamespaceObject(
    {
        encode: {
            namespace: encodeNamespace,
            version: encodeVersion,
            qualifiers: encodeQualifiers,
            qualifierValue: encodeQualifierValue,
            subpath: encodeSubpath
        },
        normalize: {
            type: normalizeType,
            namespace: normalizeNamespace,
            name: normalizeName,
            version: normalizeVersion,
            qualifiers: normalizeQualifiers,
            subpath: normalizeSubpath
        },
        validate: {
            type: validateType,
            namespace: validateNamespace,
            name: validateName,
            version: validateVersion,
            qualifierKey: validateQualifierKey,
            qualifiers: validateQualifiers,
            subpath: validateSubpath
        }
    },
    {
        encode: PurlComponentEncoder,
        normalize: PurlComponentStringNormalizer,
        validate: PurlComponentValidator
    }
)

// Known qualifiers:
// https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#known-qualifiers-keyvalue-pairs
const KnownQualifierNames = {
    __proto__: null,
    RepositoryUrl: 'repository_url',
    DownloadUrl: 'download_url',
    VcsUrl: 'vcs_url',
    FileName: 'file_name',
    Checksum: 'checksum'
}

// PURL types:
// https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst
const Type = createHelpersNamespaceObject(
    {
        normalize: {
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#alpm
            alpm(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#apk
            apk(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#bitbucket
            bitbucket(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#bitnami
            bitnami(purl) {
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#composer
            composer(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#deb
            deb(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#other-candidate-types-to-define
            gitlab(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#github
            github(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#golang
            // golang(purl) {
            //     // Ignore case-insensitive rule because go.mod are case-sensitive.
            //     // Pending spec change: https://github.com/package-url/purl-spec/pull/196
            //     lowerNamespace(purl)
            //     lowerName(purl)
            //     return purl
            // },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#hex
            hex(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#huggingface
            huggingface(purl) {
                lowerVersion(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#mlflow
            mlflow(purl) {
                if (purl.qualifiers?.repository_url?.includes('databricks')) {
                    lowerName(purl)
                }
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#npm
            npm(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#luarocks
            luarocks(purl) {
                lowerVersion(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#oci
            oci(purl) {
                lowerName(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#pub
            pub(purl) {
                lowerName(purl)
                purl.name = replaceDashesWithUnderscores(purl.name)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#pypi
            pypi(purl) {
                lowerNamespace(purl)
                lowerName(purl)
                purl.name = replaceUnderscoresWithDashes(purl.name)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#qpkg
            qpkg(purl) {
                lowerNamespace(purl)
                return purl
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#rpm
            rpm(purl) {
                lowerNamespace(purl)
                return purl
            }
        },
        validate: {
            // TODO: cocoapods name validation
            // TODO: cpan namespace validation
            // TODO: swid qualifier validation
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#conan
            conan(purl, throws) {
                if (isNullishOrEmptyString(purl.namespace)) {
                    if (purl.qualifiers?.channel) {
                        if (throws) {
                            throw new Error(
                                'Invalid purl: conan requires a "namespace" field when a "channel" qualifier is present.'
                            )
                        }
                        return false
                    }
                } else if (isNullishOrEmptyString(purl.qualifiers)) {
                    if (throws) {
                        throw new Error(
                            'Invalid purl: conan requires a "qualifiers" field when a namespace is present.'
                        )
                    }
                    return false
                }
                return true
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#cran
            cran(purl, throws) {
                return validateRequiredByType(
                    'cran',
                    'version',
                    purl.version,
                    throws
                )
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#golang
            golang(purl) {
                // Still being lenient here since the standard changes aren't official.
                // Pending spec change: https://github.com/package-url/purl-spec/pull/196
                const { version } = purl
                const length = typeof version === 'string' ? version.length : 0
                // If the version starts with a "v" then ensure its a valid semver version.
                // This, by semver semantics, also supports pseudo-version number.
                // https://go.dev/doc/modules/version-numbers#pseudo-version-number
                if (
                    length &&
                    version.charCodeAt(0) === 118 /*'v'*/ &&
                    !isSemverString(version.slice(1))
                ) {
                    if (throws) {
                        throw new Error(
                            'Invalid purl: golang "version" field starting with a "v" must be followed by a valid semver version'
                        )
                    }
                    return false
                }
                return true
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#maven
            maven(purl, throws) {
                return validateRequiredByType(
                    'maven',
                    'namespace',
                    purl.namespace,
                    throws
                )
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#mlflow
            mlflow(purl, throws) {
                return validateEmptyByType(
                    'mflow',
                    'namespace',
                    purl.namespace,
                    throws
                )
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#oci
            oci(purl, throws) {
                return validateEmptyByType(
                    'oci',
                    'namespace',
                    purl.namespace,
                    throws
                )
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#pub
            pub(purl, throws) {
                const { name } = purl
                for (let i = 0, { length } = name; i < length; i += 1) {
                    const code = name.charCodeAt(i)
                    // prettier-ignore
                    if (
                    !(
                        (
                            (code >= 48 && code <= 57)  || // 0-9
                            (code >= 97 && code <= 122) || // a-z
                            code === 95 // _
                        )
                    )
                ) {
                    if (throws) {
                        throw new Error(
                            'Invalid purl: pub "name" field may only contain [a-z0-9_] characters'
                        )
                    }
                    return false
                }
                }
                return true
            },
            // https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#swift
            swift(purl, throws) {
                return (
                    validateRequiredByType(
                        'swift',
                        'namespace',
                        purl.namespace,
                        throws
                    ) &&
                    validateRequiredByType(
                        'swift',
                        'version',
                        purl.version,
                        throws
                    )
                )
            }
        }
    },
    {
        normalize: PurlTypNormalizer,
        validate: PurlTypeValidator
    }
)

function createHelpersNamespaceObject(helpers, defaults = {}) {
    const helperNames = Object.keys(helpers).sort()
    const propNames = [
        ...new Set([...Object.values(helpers)].map(Object.keys).flat())
    ].sort()
    const nsObject = Object.create(null)
    for (let i = 0, { length } = propNames; i < length; i += 1) {
        const propName = propNames[i]
        const helpersForProp = Object.create(null)
        for (
            let j = 0, { length: length_j } = helperNames;
            j < length_j;
            j += 1
        ) {
            const helperName = helperNames[j]
            const helperValue =
                helpers[helperName][propName] ?? defaults[helperName]
            if (helperValue !== undefined) {
                helpersForProp[helperName] = helperValue
            }
        }
        nsObject[propName] = helpersForProp
    }
    return nsObject
}

class PackageURL {
    static Component = recursiveFreeze(Component)
    static KnownQualifierNames = recursiveFreeze(KnownQualifierNames)
    static Type = recursiveFreeze(Type)

    constructor(
        rawType,
        rawNamespace,
        rawName,
        rawVersion,
        rawQualifiers,
        rawSubpath
    ) {
        const type = isNonEmptyString(rawType)
            ? Component.type.normalize(rawType)
            : rawType
        Component.type.validate(type, true)

        const namespace = isNonEmptyString(rawNamespace)
            ? Component.namespace.normalize(rawNamespace)
            : rawNamespace
        Component.namespace.validate(namespace, true)

        const name = isNonEmptyString(rawName)
            ? Component.name.normalize(rawName)
            : rawName
        Component.name.validate(name, true)

        const version = isNonEmptyString(rawVersion)
            ? Component.version.normalize(rawVersion)
            : rawVersion
        Component.version.validate(version, true)

        const qualifiers = isObject(rawQualifiers)
            ? Component.qualifiers.normalize(rawQualifiers)
            : rawQualifiers
        Component.qualifiers.validate(qualifiers, true)

        const subpath = isNonEmptyString(rawSubpath)
            ? Component.subpath.normalize(rawSubpath)
            : rawSubpath
        Component.subpath.validate(subpath, true)

        this.type = type
        this.name = name
        this.namespace = namespace ?? undefined
        this.version = version ?? undefined
        this.qualifiers = qualifiers ?? undefined
        this.subpath = subpath ?? undefined

        const typeHelpers = Type[type]
        if (typeHelpers) {
            typeHelpers.normalize(this)
            typeHelpers.validate(this, true)
        }
    }

    toString() {
        const { namespace, name, version, qualifiers, subpath, type } = this
        let purlStr = `pkg:${Component.type.encode(type)}/`
        if (namespace) {
            purlStr = `${purlStr}${Component.namespace.encode(namespace)}/`
        }
        purlStr = `${purlStr}${Component.name.encode(name)}`
        if (version) {
            purlStr = `${purlStr}@${Component.version.encode(version)}`
        }
        if (qualifiers) {
            purlStr = `${purlStr}?${Component.qualifiers.encode(qualifiers)}`
        }
        if (subpath) {
            purlStr = `${purlStr}#${Component.subpath.encode(subpath)}`
        }
        return purlStr
    }

    static fromString(purlStr) {
        return new PackageURL(...PackageURL.parseString(purlStr))
    }

    static parseString(purlStr) {
        // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#how-to-parse-a-purl-string-in-its-components
        if (typeof purlStr !== 'string') {
            throw new Error('A purl string argument is required.')
        }
        if (isBlank(purlStr)) {
            return [
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            ]
        }

        // Split the remainder once from left on ':'.
        const colonIndex = purlStr.indexOf(':')
        // Use WHATWG URL to split up the purl string.
        //   - Split the purl string once from right on '#'
        //   - Split the remainder once from right on '?'
        //   - Split the remainder once from left on ':'
        let url
        try {
            url = new URL(
                colonIndex === -1
                    ? purlStr
                    : // Since a purl never contains a URL Authority, its scheme
                      // must not be suffixed with double slash as in 'pkg://'
                      // and should use instead 'pkg:'. Purl parsers must accept
                      // URLs such as 'pkg://' and must ignore the '//'
                      `pkg:${trimLeadingSlashes(purlStr.slice(colonIndex + 1))}`
            )
        } catch {
            throw new Error('Invalid purl: failed to parse as URL')
        }

        // The scheme is a constant with the value "pkg".
        if (url.protocol !== 'pkg:') {
            throw new Error(
                'Invalid purl: missing required "pkg" scheme component'
            )
        }

        // A purl must NOT contain a URL Authority i.e. there is no support for
        // username, password, host and port components.
        if (url.username !== '' || url.password !== '') {
            throw new Error(
                'Invalid purl: cannot contain a "user:pass@host:port"'
            )
        }

        const { pathname } = url
        const firstSlashIndex = pathname.indexOf('/')
        const rawType =
            firstSlashIndex === -1
                ? pathname
                : pathname.slice(0, firstSlashIndex)
        if (firstSlashIndex < 1) {
            return [
                rawType,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            ]
        }

        let rawVersion
        let atSignIndex = pathname.lastIndexOf('@')
        // Handle unencoded leading '@' characters. This is a small break from
        // the specification to make parsing more forgiving so that users don't
        // have to deal with it.
        if (
            atSignIndex !== -1 &&
            pathname.charCodeAt(atSignIndex - 1) === 47 /*'/'*/
        ) {
            atSignIndex = -1
        }
        const beforeVersion = pathname.slice(
            rawType.length + 1,
            atSignIndex === -1 ? pathname.length : atSignIndex
        )
        if (atSignIndex !== -1) {
            // Split the remainder once from right on '@'.
            rawVersion = pathname.slice(atSignIndex + 1)
        }

        let rawNamespace
        let rawName
        const lastSlashIndex = beforeVersion.lastIndexOf('/')
        if (lastSlashIndex === -1) {
            // Split the remainder once from right on '/'.
            rawName = beforeVersion
        } else {
            // Split the remainder once from right on '/'.
            rawName = beforeVersion.slice(lastSlashIndex + 1)
            // Split the remainder on '/'.
            rawNamespace = beforeVersion.slice(0, lastSlashIndex)
        }

        let rawQualifiers
        const { searchParams } = url
        if (searchParams.size !== 0) {
            // Split the remainder once from right on '?'.
            rawQualifiers = searchParams
        }

        let rawSubpath
        const { hash } = url
        if (hash.length !== 0) {
            // Split the purl string once from right on '#'.
            rawSubpath = hash.slice(1)
        }

        return [
            rawType,
            rawNamespace,
            rawName,
            rawVersion,
            rawQualifiers,
            rawSubpath
        ]
    }
}

for (const staticProp of ['Component', 'KnownQualifierNames', 'Type']) {
    Reflect.defineProperty(PackageURL, staticProp, {
        ...Reflect.getOwnPropertyDescriptor(PackageURL, staticProp),
        writable: false
    })
}

Reflect.setPrototypeOf(PackageURL.prototype, null)

module.exports = {
    PackageURL,
    PurlComponent: Component,
    PurlQualifierNames: KnownQualifierNames,
    PurlType: Type
}
