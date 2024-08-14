'use strict'

const {
    encodeNamespace,
    encodeVersion,
    encodeQualifiers,
    encodeQualifierValue,
    encodeSubpath,
    encodeURIComponent
} = require('./encode')

const {
    normalizeName,
    normalizeNamespace,
    normalizeQualifiers,
    normalizeSubpath,
    normalizeType,
    normalizeVersion
} = require('./normalize')

const { createHelpersNamespaceObject } = require('./helpers')

const {
    validateName,
    validateNamespace,
    validateQualifiers,
    validateQualifierKey,
    validateSubpath,
    validateType,
    validateVersion
} = require('./validate')

const PurlComponentEncoder = (comp) =>
    typeof comp === 'string' && comp.length ? encodeURIComponent(comp) : ''

const PurlComponentStringNormalizer = (comp) =>
    typeof comp === 'string' ? comp : undefined

const PurlComponentValidator = (_comp, _throws) => true

module.exports = {
    // Rules for each purl component:
    // https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component
    PurlComponent: createHelpersNamespaceObject(
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
}
