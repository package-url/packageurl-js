'use strict'

const { decodeURIComponent: decodeURIComponent_ } = globalThis

function decodeURIComponent(encodedURIComponent) {
    try {
        return decodeURIComponent_(encodedURIComponent)
    } catch {}
    return encodedURIComponent
}

module.exports = {
    decodeURIComponent
}
