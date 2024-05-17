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
        while ((index = purl.name.indexOf('_', fromIndex)) !== -1) {
            name = name + purl.name.slice(fromIndex, index) + '-'
            fromIndex = index + 1
        }
        if (fromIndex) {
            purl.name = name + purl.name.slice(fromIndex)
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
        if (purl.namespace === undefined) {
            if (typeof purl.qualifiers?.channel === 'string') {
                throw new Error(
                    'Invalid purl: conan requires a namespace when channel qualifiers are present.'
                )
            }
        } else if (purl.qualifiers === undefined) {
            throw new Error(
                'Invalid purl: conan requires qualifiers when namespace is present.'
            )
        }
    },
    cran(purl) {
        if (purl.version === undefined) {
            throw new Error('Invalid purl: cran requires a version.')
        }
    },
    pub(purl) {
        if (/\W/.test(purl.name)) {
            throw new Error(
                'Invalid purl: "name" argument contains an illegal character.'
            )
        }
    },
    swift(purl) {
        if (purl.namespace === undefined) {
            throw new Error('Invalid purl: swift has no namespace.')
        }
        if (purl.version === undefined) {
            throw new Error('Invalid purl: swift requires a version.')
        }
    }
}

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
    if (qualifiers?.repository_url?.includes('databricks')) {
        return rawName.toLowerCase()
    }
    return rawName
}

function normalizeNamespace(rawNamespace) {
    return typeof rawNamespace === 'string'
        ? normalizePath(rawNamespace)
        : undefined
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

function normalizeQualifiers(rawQualifiers) {
    let qualifiers
    if (typeof rawQualifiers === 'object' && rawQualifiers !== null) {
        const entries =
            typeof rawQualifiers.entries === 'function'
                ? rawQualifiers.entries()
                : Object.entries(rawQualifiers)
        qualifiers = { __proto__: null }
        for (const { 0: key, 1: value } of entries) {
            // qualifiers:
            // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component
            if (/^\d/.test(key)) {
                throw new Error(
                    `Invalid purl: qualifier "${key}" cannot start with a number.`
                )
            }
            if (/[^-.\w]/.test(key)) {
                throw new Error(
                    `Invalid purl: qualifier "${key}" contains an illegal character.`
                )
            }
            qualifiers[key.toLowerCase()] = value
        }
    } else if (rawQualifiers !== null && rawQualifiers !== undefined) {
        throw new Error(
            'Invalid purl: "qualifiers" argument must be an object.'
        )
    }
    return qualifiers
}

function normalizeSubpath(rawSubpath) {
    return typeof rawSubpath === 'string'
        ? normalizePath(rawSubpath, subpathFilter)
        : undefined
}

function normalizeType(rawType) {
    return rawType.trim().toLowerCase()
}

function normalizeVersion(rawVersion) {
    return typeof rawVersion === 'string' ? rawVersion.trim() : undefined
}

function subpathFilter(segment) {
    // subpath:
    // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component
    return segment !== '.' && segment !== '..' && segment.trim().length !== 0
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

Reflect.setPrototypeOf(PackageURL.prototype, null)

module.exports = PackageURL
