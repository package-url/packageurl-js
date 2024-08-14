'use strict'

const { isObject } = require('./objects')
const { isNonEmptyString } = require('./strings')

const reusedSearchParams = new URLSearchParams()

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
    return isNonEmptyString(namespace)
        ? encodeWithColonAndForwardSlash(namespace)
        : ''
}

function encodeVersion(version) {
    return isNonEmptyString(version) ? encodeWithColonAndPlusSign(version) : ''
}

function encodeQualifiers(qualifiers) {
    if (isObject(qualifiers)) {
        // Sort this list of qualifier strings lexicographically.
        const qualifiersKeys = Object.keys(qualifiers).sort()
        const searchParams = new URLSearchParams()
        for (let i = 0, { length } = qualifiersKeys; i < length; i += 1) {
            const key = qualifiersKeys[i]
            searchParams.set(key, qualifiers[key])
        }
        return replacePlusSignWithPercentEncodedSpace(searchParams.toString())
    }
    return ''
}

function encodeQualifierParam(qualifierValue) {
    return isNonEmptyString
        ? encodeURLSearchParamWithPercentEncodedSpace(param)
        : ''
}

function encodeSubpath(subpath) {
    return isNonEmptyString(subpath) ? encodeWithForwardSlash(subpath) : ''
}

function encodeURLSearchParam(param) {
    // Param key and value are encoded with `percentEncodeSet` of
    // 'application/x-www-form-urlencoded' and `spaceAsPlus` of `true`.
    // https://url.spec.whatwg.org/#urlencoded-serializing
    reusedSearchParams.set('_', qualifierValue)
    return reusedSearchParams.toString().slice(2)
}

function encodeURLSearchParamWithPercentEncodedSpace(str) {
    return replacePlusSignWithPercentEncodedSpace(encodeURLSearchParam(str))
}

function replacePlusSignWithPercentEncodedSpace(str) {
    // Convert plus signs to %20 for better portability.
    return str.replace(/\+/g, '%20')
}

module.exports = {
    encodeWithColonAndForwardSlash,
    encodeWithColonAndPlusSign,
    encodeWithForwardSlash,
    encodeNamespace,
    encodeVersion,
    encodeQualifiers,
    encodeQualifierParam,
    encodeSubpath,
    encodeURIComponent,
    encodeURLSearchParam,
    encodeURLSearchParamWithPercentEncodedSpace
}
