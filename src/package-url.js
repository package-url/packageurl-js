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

const LOOP_SENTINEL = 1_000_000

// This regexp is valid as of 2024-08-01.
// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const regexSemverNumberedGroups =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

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
            qualifierKey: validateQualifierKey,
            qualifiers: validateQualifiers
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
                    !regexSemverNumberedGroups.test(version.slice(1))
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

function encodeWithColonAndForwardSlash(str) {
    return encodeURIComponent(str).replace(/%3A/g, ':').replace(/%2F/g, '/')
}

function encodeWithColonAndPlusSign(str) {
    return encodeURIComponent(str).replace(/%3A/g, ':').replace(/%2B/g, '+')
}

function encodeWithForwardSlash(str) {
    return encodeURIComponent(str).replace(/%2F/g, '/')
}

function encodeNamespace(namespace) {
    return typeof namespace === 'string' && namespace.length
        ? encodeWithColonAndForwardSlash(namespace)
        : ''
}

function encodeVersion(version) {
    return typeof version === 'string' && version.length
        ? encodeWithColonAndPlusSign(version)
        : ''
}

function encodeQualifiers(qualifiers) {
    let query = ''
    if (qualifiers !== null && typeof qualifiers === 'object') {
        // Sort this list of qualifier strings lexicographically.
        const qualifiersKeys = Object.keys(qualifiers).sort()
        for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
            const key = qualifiersKeys[i]
            query = `${query}${i === 0 ? '' : '&'}${key}=${encodeQualifierValue(qualifiers[key])}`
        }
    }
    return query
}

function encodeQualifierValue(qualifierValue) {
    return typeof qualifierValue === 'string' && qualifierValue.length
        ? encodeWithColonAndForwardSlash(qualifierValue)
        : ''
}

function encodeSubpath(subpath) {
    return typeof subpath === 'string' && subpath.length
        ? encodeWithForwardSlash(subpath)
        : ''
}

function isBlank(str) {
    for (let i = 0, { length } = str; i < length; i += 1) {
        const code = str.charCodeAt(i)
        // prettier-ignore
        if (
            !(
                // Whitespace characters according to ECMAScript spec:
                // https://tc39.es/ecma262/#sec-white-space
                (
                    code === 0x0020 || // Space
                    code === 0x0009 || // Tab
                    code === 0x000a || // Line Feed
                    code === 0x000b || // Vertical Tab
                    code === 0x000c || // Form Feed
                    code === 0x000d || // Carriage Return
                    code === 0x00a0 || // No-Break Space
                    code === 0x1680 || // Ogham Space Mark
                    code === 0x2000 || // En Quad
                    code === 0x2001 || // Em Quad
                    code === 0x2002 || // En Space
                    code === 0x2003 || // Em Space
                    code === 0x2004 || // Three-Per-Em Space
                    code === 0x2005 || // Four-Per-Em Space
                    code === 0x2006 || // Six-Per-Em Space
                    code === 0x2007 || // Figure Space
                    code === 0x2008 || // Punctuation Space
                    code === 0x2009 || // Thin Space
                    code === 0x200a || // Hair Space
                    code === 0x2028 || // Line Separator
                    code === 0x2029 || // Paragraph Separator
                    code === 0x202f || // Narrow No-Break Space
                    code === 0x205f || // Medium Mathematical Space
                    code === 0x3000 || // Ideographic Space
                    code === 0xfeff    // Byte Order Mark
                )
            )
        ) {
            return false
        }
    }
    return true
}

function isNullishOrEmptyString(value) {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.length === 0)
    )
}

function lowerName(purl) {
    purl.name = purl.name.toLowerCase()
}

function lowerNamespace(purl) {
    const { namespace } = purl
    if (typeof namespace === 'string') {
        purl.namespace = namespace.toLowerCase()
    }
}

function lowerVersion(purl) {
    const { version } = purl
    if (typeof version === 'string') {
        purl.version = version.toLowerCase()
    }
}

function normalizeName(rawName) {
    return decodeURIComponent(rawName)
}

function normalizeNamespace(rawNamespace) {
    return typeof rawNamespace === 'string'
        ? normalizePath(decodeURIComponent(rawNamespace))
        : undefined
}

function normalizePath(pathname, callback) {
    let collapsed = ''
    let start = 0
    // Leading and trailing slashes, i.e. '/', are not significant and should be
    // stripped in the canonical form.
    while (pathname.charCodeAt(start) === 47 /*'/'*/) {
        start += 1
    }
    let nextIndex = pathname.indexOf('/', start)
    if (nextIndex === -1) {
        return pathname.slice(start)
    }
    // Discard any empty string segments by collapsing repeated segment
    // separator slashes, i.e. '/'.
    while (nextIndex !== -1) {
        const segment = pathname.slice(start, nextIndex)
        if (callback === undefined || callback(segment)) {
            collapsed =
                collapsed + (collapsed.length === 0 ? '' : '/') + segment
        }
        start = nextIndex + 1
        while (pathname.charCodeAt(start) === 47) {
            start += 1
        }
        nextIndex = pathname.indexOf('/', start)
    }
    const lastSegment = pathname.slice(start)
    if (
        lastSegment.length !== 0 &&
        (callback === undefined || callback(lastSegment))
    ) {
        collapsed = collapsed + '/' + lastSegment
    }
    return collapsed
}

function normalizeQualifiers(rawQualifiers) {
    if (
        rawQualifiers === null ||
        rawQualifiers === undefined ||
        typeof rawQualifiers !== 'object'
    ) {
        return undefined
    }
    const qualifiers = { __proto__: null }
    const entriesIterator =
        // URL searchParams have an "entries" method that returns an iterator.
        typeof rawQualifiers.entries === 'function'
            ? rawQualifiers.entries()
            : Object.entries(rawQualifiers)
    for (const { 0: key, 1: value } of entriesIterator) {
        const strValue = typeof value === 'string' ? value : String(value)
        const trimmed = strValue.trim()
        // Value cannot be an empty string: a key=value pair with an empty value
        // is the same as no key/value at all for this key.
        if (trimmed.length === 0) continue
        // A key is case insensitive. The canonical form is lowercase.
        qualifiers[key.toLowerCase()] = trimmed
    }
    return qualifiers
}

function normalizeSubpath(rawSubpath) {
    return typeof rawSubpath === 'string'
        ? normalizePath(decodeURIComponent(rawSubpath), subpathFilter)
        : undefined
}

function normalizeType(rawType) {
    // The type must NOT be percent-encoded.
    // The type is case insensitive. The canonical form is lowercase.
    return typeof rawType === 'string'
        ? decodeURIComponent(rawType).trim().toLowerCase()
        : undefined
}

function normalizeVersion(rawVersion) {
    return typeof rawVersion === 'string'
        ? decodeURIComponent(rawVersion).trim()
        : undefined
}

function recursiveFreeze(value_) {
    if (
        value_ === null ||
        !(typeof value_ === 'object' || typeof value_ === 'function') ||
        Object.isFrozen(value_)
    ) {
        return value_
    }
    const queue = [value_]
    let { length: queueLength } = queue
    let pos = 0
    while (pos < queueLength) {
        if (pos === LOOP_SENTINEL) {
            throw new Error(
                'Detected infinite loop in object crawl of recursiveFreeze'
            )
        }
        const obj = queue[pos++]
        Object.freeze(obj)
        if (Array.isArray(obj)) {
            for (let i = 0, { length } = obj; i < length; i += 1) {
                const item = obj[i]
                if (
                    item !== null &&
                    (typeof item === 'object' || typeof item === 'function') &&
                    !Object.isFrozen(item)
                ) {
                    queue[queueLength++] = item
                }
            }
        } else {
            const keys = Reflect.ownKeys(obj)
            for (let i = 0, { length } = keys; i < length; i += 1) {
                const propValue = obj[keys[i]]
                if (
                    propValue !== null &&
                    (typeof propValue === 'object' ||
                        typeof propValue === 'function') &&
                    !Object.isFrozen(propValue)
                ) {
                    queue[queueLength++] = propValue
                }
            }
        }
    }
    return value_
}

function replaceDashesWithUnderscores(str) {
    // Replace all "-" with "_"
    let result = ''
    let fromIndex = 0
    let index = 0
    while ((index = str.indexOf('-', fromIndex)) !== -1) {
        result = result + str.slice(fromIndex, index) + '_'
        fromIndex = index + 1
    }
    return fromIndex ? result + str.slice(fromIndex) : str
}

function replaceUnderscoresWithDashes(str) {
    // Replace all "_" with "-"
    let result = ''
    let fromIndex = 0
    let index = 0
    while ((index = str.indexOf('_', fromIndex)) !== -1) {
        result = result + str.slice(fromIndex, index) + '-'
        fromIndex = index + 1
    }
    return fromIndex ? result + str.slice(fromIndex) : str
}

function subpathFilter(segment) {
    // When percent-decoded, a segment
    //   - must not be any of '.' or '..'
    //   - must not be empty
    const { length } = segment
    if (length === 1 && segment.charCodeAt(0) === 46 /*'.'*/) return false
    if (
        length === 2 &&
        segment.charCodeAt(0) === 46 &&
        segment.charCodeAt(1) === 46
    ) {
        return false
    }
    return !isBlank(segment)
}

function trimLeadingSlashes(str) {
    let start = 0
    while (str.charCodeAt(start) === 47 /*'/'*/) {
        start += 1
    }
    return start === 0 ? str : str.slice(start)
}

function validateEmptyByType(type, name, value, throws) {
    if (!isNullishOrEmptyString(value)) {
        if (throws) {
            throw new Error(
                `Invalid purl: ${type} "${name}" field must be empty.`
            )
        }
        return false
    }
    return true
}

function validateRequired(name, value, throws) {
    if (isNullishOrEmptyString(value)) {
        if (throws) {
            throw new Error(`Invalid purl: "${name}" is a required field.`)
        }
        return false
    }
    return true
}

function validateRequiredByType(type, name, value, throws) {
    if (isNullishOrEmptyString(value)) {
        if (throws) {
            throw new Error(`Invalid purl: ${type} requires a "${name}" field.`)
        }
        return false
    }
    return true
}

function validateStartsWithoutNumber(name, value, throws) {
    if (value.length !== 0) {
        const code = value.charCodeAt(0)
        if (code >= 48 /*'0'*/ && code <= 57 /*'9'*/) {
            if (throws) {
                throw new Error(
                    `Invalid purl: ${name} "${value}" cannot start with a number.`
                )
            }
            return false
        }
    }
    return true
}

function validateQualifiers(qualifiers, throws) {
    if (qualifiers === null || qualifiers === undefined) {
        return true
    }
    if (typeof qualifiers !== 'object') {
        if (throws) {
            throw new Error(
                'Invalid purl: "qualifiers" argument must be an object.'
            )
        }
        return false
    }
    const keysIterable =
        // URL searchParams have an "keys" method that returns an iterator.
        typeof qualifiers.keys === 'function'
            ? qualifiers.keys()
            : Object.keys(qualifiers)
    for (const key of keysIterable) {
        if (!validateQualifierKey(key, throws)) {
            return false
        }
    }
    return true
}

function validateQualifierKey(key, throws) {
    // A key cannot start with a number.
    if (!validateStartsWithoutNumber('qualifier', key, throws)) {
        return false
    }
    // The key must be composed only of ASCII letters and numbers,
    // '.', '-' and '_' (period, dash and underscore).
    for (let i = 0, { length } = key; i < length; i += 1) {
        const code = key.charCodeAt(i)
        // prettier-ignore
        if (
            !(
                (
                    (code >= 48 && code <= 57)  || // 0-9
                    (code >= 65 && code <= 90)  || // A-Z
                    (code >= 97 && code <= 122) || // a-z
                    code === 46 || // .
                    code === 45 || // -
                    code === 95    // _
                )
            )
        ) {
            if (throws) {
                throw new Error(
                    `Invalid purl: qualifier "${key}" contains an illegal character.`
                )
            }
            return false
        }
    }
    return true
}

function validateStrings(name, value, throws) {
    if (value === null || value === undefined || typeof value === 'string') {
        return true
    }
    if (throws) {
        throw new Error(`Invalid purl: "'${name}" argument must be a string.`)
    }
    return false
}

function validateType(type, throws) {
    // The type cannot start with a number.
    if (!validateStartsWithoutNumber('type', type, throws)) {
        return false
    }
    // The package type is composed only of ASCII letters and numbers,
    // '.', '+' and '-' (period, plus, and dash)
    for (let i = 0, { length } = type; i < length; i += 1) {
        const code = type.charCodeAt(i)
        // prettier-ignore
        if (
            !(
                (
                    (code >= 48 && code <= 57)  || // 0-9
                    (code >= 65 && code <= 90)  || // A-Z
                    (code >= 97 && code <= 122) || // a-z
                    code === 46 || // .
                    code === 43 || // +
                    code === 45    // -
                )
            )
        ) {
            if (throws) {
                throw new Error(
                    `Invalid purl: type "${type}" contains an illegal character.`
                )
            }
            return false
        }
    }
    return true
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
        validateRequired('type', rawType, true)
        validateRequired('name', rawName, true)

        validateStrings('type', rawType, true)
        validateStrings('name', rawName, true)
        validateStrings('namespace', rawNamespace, true)
        validateStrings('version', rawVersion, true)
        validateStrings('subpath', rawSubpath, true)

        const type = Component.type.normalize(rawType)
        Component.type.validate(type, true)
        Component.qualifiers.validate(rawQualifiers, true)

        this.type = type
        this.name = Component.name.normalize(rawName)
        this.namespace = Component.namespace.normalize(rawNamespace)
        this.version = Component.version.normalize(rawVersion)
        this.qualifiers = Component.qualifiers.normalize(rawQualifiers)
        this.subpath = Component.subpath.normalize(rawSubpath)

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
        if (typeof purlStr !== 'string' || isBlank(purlStr)) {
            throw new Error('A purl non-empty string argument is required.')
        }

        // Split the remainder once from left on ':'.
        const colonIndex = purlStr.indexOf(':')
        // The left side lowercased is the scheme.
        const scheme =
            colonIndex === -1 ? '' : purlStr.slice(0, colonIndex).toLowerCase()
        // The scheme is a constant with the value "pkg"
        if (scheme !== 'pkg') {
            throw new Error(
                'purl is missing the required "pkg" scheme component.'
            )
        }

        // Since a purl never contains a URL Authority, its scheme must not be
        // suffixed with double slash as in 'pkg://' and should use instead 'pkg:'.
        //   - purl parsers must accept URLs such as 'pkg://' and must ignore the '//'.
        //   - The scheme is followed by a ':' separator.
        const afterProtocol = trimLeadingSlashes(purlStr.slice(colonIndex + 1))
        const firstSlashIndex = afterProtocol.indexOf('/')
        if (firstSlashIndex < 1) {
            throw new Error('purl is missing the required "type" component.')
        }

        // Use WHATGW URL to split up the purl string.
        let url
        try {
            url = new URL(`pkg:${afterProtocol}`)
        } catch {
            throw new Error('Invalid purl: failed to parse as URL')
        }
        // A purl must NOT contain a URL Authority i.e. there is no support for
        // username, password, host and port components.
        if (url.username !== '' || url.password !== '') {
            throw new Error(
                'Invalid purl: cannot contain a "user:pass@host:port"'
            )
        }

        const { pathname } = url

        const type = afterProtocol.slice(0, firstSlashIndex)

        let name = ''
        let namespace
        const atSignIndex = pathname.lastIndexOf('@')
        const beforeVersion = pathname.slice(
            type.length + 1,
            atSignIndex === -1 ? pathname.length : atSignIndex
        )
        // Split the remainder once from right on '/'.
        const lastSlashIndex = beforeVersion.lastIndexOf('/')
        if (lastSlashIndex === -1) {
            name = beforeVersion
        } else {
            name = beforeVersion.slice(lastSlashIndex + 1)
            // Split the remainder on '/'.
            namespace = beforeVersion.slice(0, lastSlashIndex)
        }
        if (name === '') {
            throw new Error('purl is missing the required "name" component.')
        }

        let version
        if (atSignIndex !== -1) {
            // Split the remainder once from right on '@'.
            version = pathname.slice(atSignIndex + 1)
        }

        let qualifiers
        const { searchParams } = url
        if (searchParams.size !== 0) {
            // Split the remainder once from right on '?'.
            qualifiers = searchParams
        }

        let subpath
        const { hash } = url
        if (hash.length !== 0) {
            // Split the purl string once from right on '#'.
            subpath = hash.slice(1)
        }

        return [type, namespace, name, version, qualifiers, subpath]
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
