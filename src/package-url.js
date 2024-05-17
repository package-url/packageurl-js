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

function encodeWithColon(str) {
    return encodeURIComponent(str).replace(/%3A/g, ':')
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

function normalizeName(name, type, qualifiers) {
    if (
        type === 'alpm' ||
        type === 'apk' ||
        type === 'bitbucket' ||
        type === 'bitnami' ||
        type === 'composer' ||
        type === 'debian' ||
        type === 'gitlab' ||
        type === 'github' ||
        type === 'golang' ||
        type === 'npm'
    ) {
        return name.toLowerCase()
    }
    if (type === 'pypi') {
        return name.toLowerCase().replaceAll('_', '-')
    }
    if (type === 'pub' && /\W/.test(name)) {
        throw new Error(
            'Invalid purl: "name" argument contains an illegal character.'
        )
    }
    if (
        qualifiers &&
        Object.hasOwn(qualifiers, 'repository_url') &&
        qualifiers.repository_url.includes('databricks')
    ) {
        return name.toLowerCase()
    }
    return name
}

function normalizeNamespace(namespace, type) {
    if (typeof namespace !== 'string') {
        return undefined
    }
    const normalized = normalizePath(namespace)
    if (
        type === 'alpm' ||
        type === 'apk' ||
        type === 'bitbucket' ||
        type === 'composer' ||
        type === 'debian' ||
        type === 'gitlab' ||
        type === 'github' ||
        type === 'golang' ||
        type === 'npm' ||
        type === 'pypi' ||
        type === 'qpkg' ||
        type === 'rpm'
    ) {
        return normalized.toLowerCase()
    }
    return normalized
}

function normalizeQualifiers(qualifiers) {
    if (qualifiers === null || qualifiers === undefined) {
        return undefined
    }
    if (typeof qualifiers !== 'object') {
        throw new Error(
            'Invalid purl: "qualifiers" argument must be a dictionary.'
        )
    }
    const entries =
        typeof qualifiers.entries === 'function'
            ? qualifiers.entries()
            : Object.entries(qualifiers)
    const normalized = {}
    for (const { 0: key, 1: value } of entries) {
        const lowered = key.toLowerCase()
        if (!/^[a-z]+$/.test(lowered) && !/[.-_]/.test(lowered)) {
            throw new Error(
                `Invalid purl: qualifier "${key}" contains an illegal character.`
            )
        }
        normalized[lowered] = value
    }
    return normalized
}

function normalizePath(pathname, callback) {
    let collapsed = ''
    let start = 0
    while (pathname.charCodeAt(start) === 47) {
        start += 1
    }
    let nextIndex = pathname.indexOf('/', start)
    if (nextIndex === -1) {
        return pathname.slice(start)
    }
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

function normalizeSubpath(subpath) {
    return typeof subpath === 'string'
        ? normalizePath(subpath, subpathFilter)
        : undefined
}

function normalizeType(type) {
    return type.trim().toLowerCase()
}

function normalizeVersion(version, type) {
    if (typeof version !== 'string') {
        return undefined
    }
    let normalized = version.trim()
    if (type === 'huggingface') {
        return normalized.toLowerCase()
    }
    return normalized
}

function subpathFilter(segment) {
    return segment !== '.' && segment !== '..'
}

function trimLeadingSlashes(str) {
    let start = 0
    while (str.charCodeAt(start) === 47) {
        start += 1
    }
    return start === 0 ? str : str.slice(start)
}

function validateRequired(name, value) {
    if (!value) {
        throw new Error(`Invalid purl: "${name}" is a required field.`)
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

class PackageURL {
    static get KnownQualifierNames() {
        return KnownQualifierNames
    }

    constructor(type, namespace, name, version, qualifiers, subpath) {
        validateRequired('type', type)
        validateRequired('name', name)

        validateStrings('type', type)
        validateStrings('namespace', namespace)
        validateStrings('name', name)
        validateStrings('version', version)
        validateStrings('subpath', subpath)

        const normType = normalizeType(type)
        const normQualifiers = normalizeQualifiers(qualifiers)
        const normName = normalizeName(name, normType, normQualifiers)
        const normNamespace = normalizeNamespace(namespace, normType)
        const normVersion = normalizeVersion(version, normType)
        const normSubpath = normalizeSubpath(subpath)

        if (normType === 'conan') {
            if (normQualifiers) {
                if (
                    normNamespace === undefined &&
                    Object.hasOwn(qualifiers, 'channel')
                ) {
                    throw new Error(
                        'Invalid purl: conan has only channel qualifiers.'
                    )
                }
            } else if (normNamespace) {
                throw new Error('Invalid purl: conan has only namespace.')
            }
        } else if (normType === 'cran') {
            if (normVersion === undefined) {
                throw new Error('Invalid purl: cran requires a version.')
            }
        } else if (normType === 'swift') {
            if (normNamespace === undefined) {
                throw new Error('Invalid purl: swift has no namespace.')
            }
            if (normVersion === undefined) {
                throw new Error('Invalid purl: swift requires a version.')
            }
        }

        this.type = normType
        this.name = normName
        this.namespace = normNamespace
        this.version = normVersion
        this.qualifiers = normQualifiers
        this.subpath = normSubpath
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
            let qstr = ''
            const qualifiersKeys = Object.keys(qualifiers).sort()
            for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
                const key = qualifiersKeys[i]
                qstr = `${qstr}${qstr.length ? '&' : ''}${encodeWithColon(key)}=${encodeWithColonAndForwardSlash(qualifiers[key])}`
            }
            purl = `${purl}?${qstr}`
        }

        if (subpath) {
            purl = `${purl}#${encodeWithForwardSlash(subpath)}`
        }

        return purl
    }

    static fromString(purl) {
        if (
            typeof purl !== 'string' ||
            purl.length === 0 ||
            purl.trim().length === 0
        ) {
            throw new Error('A purl non-empty string argument is required.')
        }

        const colonIndex = purl.indexOf(':')
        const scheme = colonIndex === -1 ? '' : purl.slice(0, colonIndex)
        if (scheme !== 'pkg') {
            throw new Error(
                'purl is missing the required "pkg" scheme component.'
            )
        }

        const afterProtocol = trimLeadingSlashes(purl.slice(colonIndex + 1))
        const firstSlashIndex = afterProtocol.indexOf('/')
        if (firstSlashIndex < 1) {
            throw new Error('purl is missing the required "type" component.')
        }

        const url = new URL(`pkg:${afterProtocol}`)
        if (url.username !== '' || url.password !== '') {
            throw new Error(
                'Invalid purl: cannot contain a "user:pass@host:port"'
            )
        }

        const encodedType = afterProtocol.slice(0, firstSlashIndex)
        const type = decodeURIComponent(encodedType)

        const { hash, searchParams } = url
        const pathname = url.pathname

        let version
        const atSignIndex = pathname.lastIndexOf('@')
        if (atSignIndex !== -1) {
            version = decodeURIComponent(pathname.slice(atSignIndex + 1))
        }

        let name = ''
        let namespace
        const beforeVersion = pathname.slice(
            encodedType.length + 1,
            atSignIndex === -1 ? pathname.length : atSignIndex
        )
        const lastSlashIndex = beforeVersion.lastIndexOf('/')
        if (lastSlashIndex === -1) {
            name = decodeURIComponent(beforeVersion)
        } else {
            namespace = decodeURIComponent(
                beforeVersion.slice(0, lastSlashIndex)
            )
            name = decodeURIComponent(beforeVersion.slice(lastSlashIndex + 1))
        }
        if (name === '') {
            throw new Error('purl is missing the required "name" component.')
        }

        let qualifiers
        if (searchParams.size !== 0) {
            qualifiers = searchParams
        }

        let subpath
        if (hash.length !== 0) {
            subpath = decodeURIComponent(hash.slice(1))
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

module.exports = PackageURL
