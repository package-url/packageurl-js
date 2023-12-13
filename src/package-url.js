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

function valifateQualifiers(qualifiers) {
    if (typeof qualifiers !== 'object' || qualifiers === null) {
        throw new Error(
            'Invalid purl: "qualifiers" argument must be a dictionary.'
        )
    }
    const qualifiersKeys = Object.keys(qualifiers)
    for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
        const key = qualifiersKeys[i]
        if (!/^[a-z]+$/i.test(key) && !/[\.-_]/.test(key)) {
            throw new Error(
                `Invalid purl: qualifier "${key}" contains an illegal character.`
            )
        }
    }
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
        validateStrings('namespace', type)
        validateStrings('name', type)
        validateStrings('versions', type)
        validateStrings('subpath', subpath)

        if (qualifiers) {
            valifateQualifiers(qualifiers)
        }

        this.type = type
        this.name = name
        this.namespace = namespace ?? undefined
        this.version = version ?? undefined
        this.qualifiers = qualifiers ?? undefined
        this.subpath = subpath ?? undefined
    }

    _handlePyPi() {
        this.name = this.name.toLowerCase().replaceAll('_', '-')
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
        if (type === 'pypi') {
            this._handlePyPi()
        } else if (type === 'pub') {
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
        const scheme = purl.slice(0, purl.indexOf(':'))
        if (scheme !== 'pkg') {
            throw new Error(
                'purl is missing the required "pkg" scheme component.'
            )
        }

        let remainder = purl.slice(purl.indexOf(':') + 1)
        // this strip '/, // and /// as possible in :// or :///
        // from https://gist.github.com/refo/47632c8a547f2d9b6517#file-remove-leading-slash
        remainder = remainder.trim().replace(/^\/+/g, '')

        let type
        ;({ 0: type, 1: remainder } = remainder.split('/', 2))
        if (!type || !remainder) {
            throw new Error('purl is missing the required "type" component.')
        }
        type = decodeURIComponent(type)

        const url = new URL(purl)

        const { searchParams } = url
        let qualifiers = undefined
        if (searchParams.size) {
            qualifiers = {}
            for (const { 0: key, 1: value } of searchParams) {
                qualifiers[key] = value
            }
        }

        let { hash: subpath } = url
        if (subpath.indexOf('#') === 0) {
            subpath = subpath.slice(1)
        }
        subpath = subpath.length === 0 ? undefined : decodeURIComponent(subpath)

        if (url.username !== '' || url.password !== '') {
            throw new Error(
                'Invalid purl: cannot contain a "user:pass@host:port"'
            )
        }

        // this strip '/, // and /// as possible in :// or :///
        // from https://gist.github.com/refo/47632c8a547f2d9b6517#file-remove-leading-slash
        const path = url.pathname.trim().replace(/^\/+/g, '')

        // version is optional - check for existence
        let version = undefined
        const atSignIndex = path.lastIndexOf('@')
        if (atSignIndex !== -1) {
            const rawVersion = path.slice(atSignIndex + 1)
            version = decodeURIComponent(rawVersion)

            // Convert percent-encoded colons (:) back, to stay in line with the `toString`
            // implementation of this library.
            // https://github.com/package-url/packageurl-js/blob/58026c86978c6e356e5e07f29ecfdccbf8829918/src/package-url.js#L98C10-L98C10
            const versionEncoded = encodeWithColonAndPlusSign(version)

            if (rawVersion !== versionEncoded) {
                throw new Error('Invalid purl: version must be percent-encoded')
            }

            remainder = path.slice(0, atSignIndex)
        } else {
            remainder = path
        }

        // The 'remainder' should now consist of an optional namespace and the name
        const remaining = remainder.split('/').slice(1)
        let name = ''
        let namespace = undefined
        if (remaining.length > 1) {
            const nameIndex = remaining.length - 1
            const namespaceComponents = remaining.slice(0, nameIndex)
            name = decodeURIComponent(remaining[nameIndex])
            namespace = decodeURIComponent(namespaceComponents.join('/'))
        } else if (remaining.length === 1) {
            name = decodeURIComponent(remaining[0])
        }

        if (name === '') {
            throw new Error('purl is missing the required "name" component.')
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
