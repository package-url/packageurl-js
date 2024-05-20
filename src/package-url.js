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

const KnownQualifierNames = Object.freeze({
    // known qualifiers as defined here:
    // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#known-qualifiers-keyvalue-pairs
    RepositoryUrl: 'repository_url',
    DownloadUrl: 'download_url',
    VcsUrl: 'vcs_url',
    FileName: 'file_name',
    Checksum: 'checksum'
})

const normalize = {
    alpm(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    apk(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    bitbucket(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    bitnami(purl) {
        lowerName(purl)
    },
    composer(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    debian(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    gitlab(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    github(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    golang(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    huggingface(purl) {
        lowerVersion(purl)
    },
    npm(purl) {
        lowerNamespace(purl)
        lowerName(purl)
    },
    pypi(purl) {
        lowerNamespace(purl)
        lowerName(purl)
        // Replace all "_" with "-"
        let name = ''
        let fromIndex = 0
        let index = 0
        const { name: oldName } = purl
        while ((index = oldName.indexOf('_', fromIndex)) !== -1) {
            name = name + oldName.slice(fromIndex, index) + '-'
            fromIndex = index + 1
        }
        if (fromIndex) {
            purl.name = name + oldName.slice(fromIndex)
        }
    },
    qpkg(purl) {
        lowerNamespace(purl)
    },
    rpm(purl) {
        lowerNamespace(purl)
    }
}

const validate = {
    conan(purl) {
        if (isEmpty(purl.namespace)) {
            if (purl.qualifiers?.channel) {
                throw new Error(
                    'Invalid purl: conan requires a "namespace" field when a "channel" qualifier is present.'
                )
            }
        } else if (isEmpty(purl.qualifiers)) {
            throw new Error(
                'Invalid purl: conan requires a "qualifiers" field when a namespace is present.'
            )
        }
    },
    cran(purl) {
        validateRequiredByType('cran', 'version', purl.version)
    },
    maven(purl) {
        validateRequiredByType('maven', 'namespace', purl.namespace)
    },
    pub(purl) {
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
                throw new Error(
                    'Invalid purl: pub "name" field may only contain [a-z0-9_] characters'
                )
            }
        }
    },
    swift(purl) {
        validateRequiredByType('swift', 'namespace', purl.namespace)
        validateRequiredByType('swift', 'version', purl.version)
    }
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

function isEmpty(value) {
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

function normalizeName(rawName, qualifiers) {
    return decodeURIComponent(
        qualifiers?.repository_url?.includes('databricks')
            ? rawName.toLowerCase()
            : rawName
    )
}

function normalizeNamespace(rawNamespace) {
    return typeof rawNamespace === 'string'
        ? normalizePath(decodeURIComponent(rawNamespace))
        : undefined
}

function normalizePath(pathname, callback) {
    let collapsed = ''
    let start = 0
    // Leading and trailing slashes '/' are not significant and should be
    // stripped in the canonical form.
    while (pathname.charCodeAt(start) === 47) {
        start += 1
    }
    let nextIndex = pathname.indexOf('/', start)
    if (nextIndex === -1) {
        return pathname.slice(start)
    }
    // Discard any empty string segments by collapsing repeated segment
    // separator slashes '/'.
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
    if (rawQualifiers === null || rawQualifiers === undefined) {
        return undefined
    }
    if (typeof rawQualifiers !== 'object') {
        throw new Error(
            'Invalid purl: "qualifiers" argument must be an object.'
        )
    }
    const entries =
        // URL searchParams have an "entries" method.
        typeof rawQualifiers.entries === 'function'
            ? rawQualifiers.entries()
            : Object.entries(rawQualifiers)
    const qualifiers = { __proto__: null }
    for (const { 0: key, 1: value } of entries) {
        const strValue = typeof value === 'string' ? value : String(value)
        const trimmed = strValue.trim()
        // Value cannot be an empty string: a key=value pair with an empty value
        // is the same as no key/value at all for this key.
        if (trimmed.length === 0) continue
        validateQualifierKey(key)
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
    const type = decodeURIComponent(rawType).trim().toLowerCase()
    validateType(type)
    return type
}

function normalizeVersion(rawVersion) {
    return typeof rawVersion === 'string'
        ? decodeURIComponent(rawVersion).trim()
        : undefined
}

function subpathFilter(segment) {
    // When percent-decoded, a segment
    //   - must not be any of '.' or '..'
    //   - must not be empty
    const { length } = segment
    if (length === 1 && segment.charCodeAt(0) === 46) return false
    if (
        length === 2 &&
        segment.charCodeAt(0) === 46 &&
        segment.charCodeAt(1) === 46
    )
        return false
    return !isBlank(segment)
}

function trimLeadingSlashes(str) {
    let start = 0
    while (str.charCodeAt(start) === 47) {
        start += 1
    }
    return start === 0 ? str : str.slice(start)
}

function validateRequired(name, value) {
    if (isEmpty(value)) {
        throw new Error(`Invalid purl: "${name}" is a required field.`)
    }
}

function validateRequiredByType(type, name, value) {
    if (isEmpty(value)) {
        throw new Error(`Invalid purl: ${type} requires a "${name}" field.`)
    }
}

function validateStartsWithoutNumber(name, value) {
    if (value.length !== 0) {
        const code = value.charCodeAt(0)
        if (code >= 48 /*0*/ && code <= 57 /*9*/) {
            throw new Error(
                `Invalid purl: ${name} "${value}" cannot start with a number.`
            )
        }
    }
}

function validateQualifierKey(key) {
    // A key cannot start with a number.
    validateStartsWithoutNumber('qualifier', key)
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
            throw new Error(
                `Invalid purl: qualifier "${key}" contains an illegal character.`
            )
        }
    }
}

function validateStrings(name, value) {
    if (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.length !== 0)
    ) {
        return
    }
    throw new Error(
        `Invalid purl: "'${name}" argument must be a non-empty string.`
    )
}

function validateType(type) {
    // The type cannot start with a number.
    validateStartsWithoutNumber('type', type)
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
            throw new Error(
                `Invalid purl: type "${type}" contains an illegal character.`
            )
        }
    }
}

class PackageURL {
    static get KnownQualifierNames() {
        return KnownQualifierNames
    }

    constructor(
        rawType,
        rawNamespace,
        rawName,
        rawVersion,
        rawQualifiers,
        rawSubpath
    ) {
        validateRequired('type', rawType)
        validateRequired('name', rawName)

        validateStrings('type', rawType)
        validateStrings('namespace', rawNamespace)
        validateStrings('name', rawName)
        validateStrings('version', rawVersion)
        validateStrings('subpath', rawSubpath)

        const type = normalizeType(rawType)
        const qualifiers = normalizeQualifiers(rawQualifiers)

        this.type = type
        this.name = normalizeName(rawName, qualifiers)
        this.namespace = normalizeNamespace(rawNamespace)
        this.version = normalizeVersion(rawVersion)
        this.qualifiers = qualifiers
        this.subpath = normalizeSubpath(rawSubpath)

        const normalizer = normalize[type]
        // Apply type-specific normalization to the name if needed.
        // Apply type-specific normalization to each namespace segment if needed.
        if (typeof normalizer === 'function') {
            normalizer(this)
        }
        const validator = validate[type]
        if (typeof validator === 'function') {
            validator(this)
        }
    }

    toString() {
        const { namespace, name, version, qualifiers, subpath, type } = this
        let purl = `pkg:${encodeURIComponent(type)}/`
        if (namespace) {
            purl = `${purl}${encodeWithColonAndForwardSlash(namespace)}/`
        }
        purl = `${purl}${encodeURIComponent(name)}`
        if (version) {
            purl = `${purl}@${encodeWithColonAndPlusSign(version)}`
        }
        if (qualifiers) {
            let query = ''
            // Sort this list of qualifier strings lexicographically.
            const qualifiersKeys = Object.keys(qualifiers).sort()
            for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
                const key = qualifiersKeys[i]
                query = `${query}${i === 0 ? '' : '&'}${key}=${encodeWithColonAndForwardSlash(qualifiers[key])}`
            }
            purl = `${purl}?${query}`
        }
        if (subpath) {
            purl = `${purl}#${encodeWithForwardSlash(subpath)}`
        }
        return purl
    }

    static fromString(purl) {
        // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#how-to-parse-a-purl-string-in-its-components
        if (typeof purl !== 'string' || isBlank(purl)) {
            throw new Error('A purl non-empty string argument is required.')
        }

        // Split the remainder once from left on ':'.
        const colonIndex = purl.indexOf(':')
        // The left side lowercased is the scheme.
        const scheme =
            colonIndex === -1 ? '' : purl.slice(0, colonIndex).toLowerCase()
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
        const afterProtocol = trimLeadingSlashes(purl.slice(colonIndex + 1))
        const firstSlashIndex = afterProtocol.indexOf('/')
        if (firstSlashIndex < 1) {
            throw new Error('purl is missing the required "type" component.')
        }

        // Use WHATGW URL to split up the purl string.
        const url = new URL(`pkg:${afterProtocol}`)
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

        return new PackageURL(
            type,
            namespace,
            name,
            version,
            qualifiers,
            subpath
        )
    }
}

Reflect.setPrototypeOf(PackageURL.prototype, null)

module.exports = PackageURL
