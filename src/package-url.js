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

function normalizeName(name, type) {
    if (type === 'bitbucket' || type === 'gitlab' || type === 'github') {
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
    return name
}

function normalizeNamespace(namespace, type) {
    if (typeof namespace !== 'string') {
        return undefined
    }
    if (
        type === 'bitbucket' ||
        type === 'gitlab' ||
        type === 'github' ||
        type === 'pypi'
    ) {
        return namespace.toLowerCase()
    }
    return namespace
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

function normalizeSubpath(subpath) {
    if (typeof subpath !== 'string') {
        return undefined
    }
    const segments = subpath.split('/')
    const filtered = []
    for (let i = 0, { length } = segments; i < length; i += 1) {
        const s = segments[i].trim()
        if (s.length !== 0 && s !== '.' && s !== '..') {
            filtered.push(s)
        }
    }
    return filtered.join('/')
}

function normalizeType(type) {
    return type.trim().toLowerCase()
}

function normalizeVersion(version) {
    if (typeof version !== 'string') {
        return undefined
    }
    return version.trim()
}

function validateRequired(name, value) {
    if (!value) {
        throw new Error(`Invalid purl: "${name}" is a required field.`)
    }
}

function validateStrings(name, value) {
    if (typeof value === 'string' ? value.length === 0 : value) {
        throw new Error(
            `Invalid purl: "'${name}" argument must be a non-empty string.`
        )
    }
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

        this.type = normalizeType(type)
        this.name = normalizeName(name, type)
        this.namespace = normalizeNamespace(namespace, type)
        this.version = normalizeVersion(version)
        this.qualifiers = normalizeQualifiers(qualifiers)
        this.subpath = normalizeSubpath(subpath)
    }

    _handlePub() {
        const lowered = this.name.toLowerCase()
        if (!/^\w+$/.test(lowered)) {
            throw new Error('Invalid purl: contains an illegal character.')
        }
        this.name = lowered
    }

    toString() {
        const { type } = this
        if (type === 'pub') {
            this._handlePub()
        }
        const { namespace, name, version, qualifiers, subpath } = this
        let purl = `pkg:${encodeURIComponent(type)}/`

        if (namespace) {
            purl = `${purl}${encodeWithColonAndForwardSlash(namespace)}/`
        }

        purl = `${purl}${encodeWithColon(name)}`

        if (version) {
            purl = `${purl}@${encodeWithColonAndPlusSign(version)}`
        }

        if (qualifiers) {
            let qstr = ''
            const qualifiersKeys = Object.keys(qualifiers).sort()
            for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
                const key = qualifiersKeys[i]
                qstr = `${qstr}${qstr.length ? '&' : ''}${encodeWithColon(key)}=${encodeWithForwardSlash(qualifiers[key])}`
            }
            purl = `${purl}?${qstr}`
        }

        if (subpath) {
            purl = `${purl}#${encodeWithColonAndForwardSlash(subpath)}`
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

        const afterProtocol = purl
            .slice(colonIndex + 1)
            // consolidate forward slashes
            .replace(/\/{2,}/, '/')
            // trim leading forward, e.g. :// or :///
            .trim()
            .replace(/^\/+/g, '')
        const firstSlashIndex = afterProtocol.indexOf('/')
        if (firstSlashIndex < 1) {
            throw new Error('purl is missing the required "type" component.')
        }

        const encodedType = afterProtocol
            .slice(0, firstSlashIndex)
            .toLowerCase()
        const afterType = afterProtocol.slice(firstSlashIndex + 1)
        const url = new URL(`pkg:${encodedType}/${afterType}`)
        if (url.username !== '' || url.password !== '') {
            throw new Error(
                'Invalid purl: cannot contain a "user:pass@host:port"'
            )
        }

        const type = decodeURIComponent(encodedType)
        const { hash, pathname, searchParams } = url
        const trimmedHash = hash.startsWith('#') ? hash.slice(1) : hash

        let version
        const atSignIndex = pathname.lastIndexOf('@')
        if (atSignIndex !== -1) {
            const rawVersion = pathname.slice(atSignIndex + 1)
            version = decodeURIComponent(rawVersion)
            // Convert percent-encoded colons (:) back, to stay in line with the `toString`.
            if (rawVersion !== encodeWithColonAndPlusSign(version)) {
                throw new Error('Invalid purl: version must be percent-encoded')
            }
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
        if (trimmedHash.length !== 0) {
            subpath = decodeURIComponent(trimmedHash)
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
