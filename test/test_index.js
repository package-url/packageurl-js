/*
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

const assert = require('assert');
const fs = require('fs');

const TEST_FILE = require(__dirname + '/data/test-suite-data.json');

const PackageURL = require('../index');

describe('PackageURL', function() {
  TEST_FILE.forEach(function(obj) {
    if (obj.is_invalid) {
      it('should raise errors for invalid PackageURLs', function() {
        try {
          PackageURL.fromString(obj.purl);
        } catch(e) {
          assert.equal(true, e.toString().includes('Error: purl is missing the required'));
        }
      })
    } else {
      it('should encode/decode valid PackageURLs', function() {
        var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
        assert.equal(obj.canonical_purl, purl.toString());
      });
    }
  });
});
