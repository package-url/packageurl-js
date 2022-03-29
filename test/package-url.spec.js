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
const TEST_FILE = require(__dirname + '/data/test-suite-data.json');

const PackageURL = require('../src/package-url');

describe('PackageURL', function () {
  TEST_FILE.forEach(function (obj) {
    if (obj.is_invalid) {
      it('should not be possible to create invalid PackageURLs', function () {
        try {
          var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
          assert.fail();
        } catch (e) {
          assert.equal(true, e.toString().includes('is a required field') || e.toString().includes('Invalid purl'));
        }
      });
      it('should not be possible to parse invalid PackageURLs', function () {
        try {
          PackageURL.fromString(obj.purl);
        } catch (e) {
          assert.equal(true, e.toString().includes('Error: purl is missing the required') || e.toString().includes('Invalid purl'));
        }
      });
    } else {
      it('should be able to create valid PackageURLs', function () {
        var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
        assert.equal(obj.type, purl.type);
        assert.equal(obj.name, purl.name);
        assert.equal(obj.namespace, purl.namespace);
        assert.equal(obj.version, purl.version);
        assert.equal(JSON.stringify(obj.qualifiers), JSON.stringify(purl.qualifiers));
        assert.equal(obj.subpath, purl.subpath);
      });
      it('should be able to convert valid PackageURLs to a string', function () {
        var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
        assert.equal(obj.canonical_purl, purl.toString());
      });
      it('should be able to parse valid PackageURLs', function () {
        var purl = PackageURL.fromString(obj.canonical_purl);
        assert.equal(purl.toString(), obj.canonical_purl);
        assert.equal(purl.type, obj.type);
        assert.equal(purl.name, obj.name);
        assert.equal(purl.namespace, obj.namespace);
        assert.equal(purl.version, obj.version);
        assert.equal(JSON.stringify(purl.qualifiers), JSON.stringify(obj.qualifiers));
        assert.equal(purl.subpath, obj.subpath);
      });
      it('should handle pypi package-urls per the purl-spec', function () {
        const purlMixedCasing = PackageURL.fromString('pkg:pypi/PYYaml@5.3.0');
        assert.strictEqual(purlMixedCasing.toString(), 'pkg:pypi/pyyaml@5.3.0');
        const purlWithUnderscore = PackageURL.fromString('pkg:pypi/typing_extensions_blah@1.0.0');
        assert.strictEqual(purlWithUnderscore.toString(), 'pkg:pypi/typing-extensions-blah@1.0.0');
      });
    }
  });
});
