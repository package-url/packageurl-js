'use strict'

const { encodeURIComponent } = globalThis

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

module.exports = {
    encodeWithColonAndForwardSlash,
    encodeWithColonAndPlusSign,
    encodeWithForwardSlash,
    encodeNamespace,
    encodeVersion,
    encodeQualifiers,
    encodeQualifierValue,
    encodeSubpath,
    encodeURIComponent
}
