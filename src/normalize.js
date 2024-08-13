'use strict'

const { isBlank } = require('./strings')

const { decodeURIComponent } = globalThis

function normalizeName(rawName) {
    return typeof rawName === 'string'
        ? decodeURIComponent(rawName).trim()
        : undefined
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
    const entriesIterator =
        // URL searchParams have an "entries" method that returns an iterator.
        typeof rawQualifiers.entries === 'function'
            ? rawQualifiers.entries()
            : Object.entries(rawQualifiers)
    let qualifiers
    for (const { 0: key, 1: value } of entriesIterator) {
        const strValue = typeof value === 'string' ? value : String(value)
        const trimmed = strValue.trim()
        // Value cannot be an empty string: a key=value pair with an empty value
        // is the same as no key/value at all for this key.
        if (trimmed.length === 0) {
            continue
        }
        if (qualifiers === undefined) {
            qualifiers = { __proto__: null }
        }
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

module.exports = {
    normalizeName,
    normalizeNamespace,
    normalizePath,
    normalizeQualifiers,
    normalizeSubpath,
    normalizeType,
    normalizeVersion
}
