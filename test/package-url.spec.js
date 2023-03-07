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

const assert = require('assert');
const {describe, it} = require("mocha");

const TEST_FILE = require('./data/test-suite-data.json');

/** @type {import('../src/package-url')} */
const PackageURL = require('../src/package-url');

describe('PackageURL', function () {
  describe('toString()', function () {
    it('all components encode #', function () {
      /* The # is a delimiter between url and subpath. */
      var purl = new PackageURL('ty#pe', 'name#space', 'na#me', 'ver#sion', {'foo':'bar#baz'}, 'sub#path');
      assert.strictEqual(purl.toString(), 'pkg:ty%23pe/name%23space/na%23me@ver%23sion?foo=bar%23baz#sub%23path')
    })
    it('all components encode @', function () {
      /* The @ is a delimiter between package name and version. */
      var purl = new PackageURL('ty@pe', 'name@space', 'na@me', 'ver@sion', {'foo':'bar@baz'}, 'sub@path');
      assert.strictEqual(purl.toString(), 'pkg:ty%40pe/name%40space/na%40me@ver%40sion?foo=bar%40baz#sub%40path')
    })

    it('path components encode /', function () {
      /* only namespace is allowed to have multiple segments separated by `/`` */
      var purl = new PackageURL('ty/pe', 'namespace1/namespace2', 'na/me');
      assert.strictEqual(purl.toString(), 'pkg:ty%2Fpe/namespace1/namespace2/na%2Fme')
    })
  })

  describe('fromString()', function () {
    it('with qualifiers.checksums', function () {
      const purlString = 'pkg:npm/packageurl-js@0.0.7?checksums=sha512:b9c27369720d948829a98118e9a35fd09d9018711e30dc2df5f8ae85bb19b2ade4679351c4d96768451ee9e841e5f5a36114a9ef98f4fe5256a5f4ca981736a0'

      const purl = PackageURL.fromString(purlString)

      assert.strictEqual(purl.type, 'npm')
      assert.strictEqual(purl.namespace, null)
      assert.strictEqual(purl.name, 'packageurl-js')
      assert.strictEqual(purl.version, '0.0.7')
      assert.deepStrictEqual(purl.qualifiers, {
        checksums: 'sha512:b9c27369720d948829a98118e9a35fd09d9018711e30dc2df5f8ae85bb19b2ade4679351c4d96768451ee9e841e5f5a36114a9ef98f4fe5256a5f4ca981736a0'
      })
    });

    it('with qualifiers.vcs_url', function () {
      const purlString = 'pkg:npm/packageurl-js@0.0.7?vcs_url=git%2Bhttps%3A%2F%2Fgithub.com%2Fpackage-url%2Fpackageurl-js.git'

      const purl = PackageURL.fromString(purlString)

      assert.strictEqual(purl.type, 'npm')
      assert.strictEqual(purl.namespace, null)
      assert.strictEqual(purl.name, 'packageurl-js')
      assert.strictEqual(purl.version, '0.0.7')
      assert.deepStrictEqual(purl.qualifiers, {
        vcs_url: 'git+https://github.com/package-url/packageurl-js.git'
      })
    });

    it('namespace with multiple segments', function () {
      var purl = PackageURL.fromString('pkg:ty%2Fpe/namespace1/namespace2/na%2Fme')
      assert.strictEqual('ty/pe', purl.type)
      assert.strictEqual('namespace1/namespace2', purl.namespace)
      assert.strictEqual('na/me', purl.name)
    })

    it('encoded #', function () {
      var purl = PackageURL.fromString('pkg:ty%23pe/name%23space/na%23me@ver%23sion?foo=bar%23baz#sub%23path')
      assert.strictEqual('ty#pe', purl.type)
      assert.strictEqual('name#space', purl.namespace)
      assert.strictEqual('na#me', purl.name)
      assert.strictEqual('ver#sion', purl.version)
      assert.deepStrictEqual({foo:'bar#baz'}, purl.qualifiers)
      assert.strictEqual('sub#path', purl.subpath)
    })

    it('encoded @', function () {
      var purl = PackageURL.fromString('pkg:ty%40pe/name%40space/na%40me@ver%40sion?foo=bar%40baz#sub%40path')
      assert.strictEqual('ty@pe', purl.type)
      assert.strictEqual('name@space', purl.namespace)
      assert.strictEqual('na@me', purl.name)
      assert.strictEqual('ver@sion', purl.version)
      assert.deepStrictEqual({foo:'bar@baz'}, purl.qualifiers)
      assert.strictEqual('sub@path', purl.subpath)
    })
  });

  describe('test-suite-data', function () {
    TEST_FILE.forEach(function (obj) {
      if (obj.is_invalid) {
        it('should not be possible to create invalid PackageURLs', function () {
          try {
            var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
            assert.fail();
          } catch (e) {
            assert.ok(e.toString().includes('is a required field') || e.toString().includes('Invalid purl'));
          }
        });
        it('should not be possible to parse invalid PackageURLs', function () {
          try {
            PackageURL.fromString(obj.purl);
          } catch (e) {
            assert.ok(e.toString().includes('Error: purl is missing the required') || e.toString().includes('Invalid purl'));
          }
        });
      } else {
        it('should be able to create valid PackageURLs', function () {
          var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
          assert.strictEqual(purl.type, obj.type);
          assert.strictEqual(purl.name, obj.name);
          assert.strictEqual(purl.namespace, obj.namespace);
          assert.strictEqual(purl.version, obj.version);
          assert.deepStrictEqual(purl.qualifiers, obj.qualifiers);
          assert.strictEqual(purl.subpath, obj.subpath, );
        });
        it('should be able to convert valid PackageURLs to a string', function () {
          var purl = new PackageURL(obj.type, obj.namespace, obj.name, obj.version, obj.qualifiers, obj.subpath);
          assert.strictEqual(purl.toString(), obj.canonical_purl);
        });
        it('should be able to parse valid PackageURLs', function () {
          var purl = PackageURL.fromString(obj.canonical_purl);
          assert.strictEqual(purl.toString(), obj.canonical_purl);
          assert.strictEqual(purl.type, obj.type);
          assert.strictEqual(purl.name, obj.name);
          assert.strictEqual(purl.namespace, obj.namespace);
          assert.strictEqual(purl.version, obj.version);
          assert.deepStrictEqual(purl.qualifiers, obj.qualifiers);
          assert.strictEqual(purl.subpath, obj.subpath);
        });
        it('should handle pypi package-urls per the purl-spec', function () {
          const purlMixedCasing = PackageURL.fromString('pkg:pypi/PYYaml@5.3.0');
          assert.strictEqual(purlMixedCasing.toString(), 'pkg:pypi/pyyaml@5.3.0');
          const purlWithUnderscore = PackageURL.fromString('pkg:pypi/typing_extensions_blah@1.0.0');
          assert.strictEqual(purlWithUnderscore.toString(), 'pkg:pypi/typing-extensions-blah@1.0.0');
        });
      }
    })
  });

  describe('KnownQualifierNames', function () {
    describe('check access', function () {
      [
        ['RepositoryUrl', 'repository_url'],
        ['DownloadUrl', 'download_url'],
        ['VcsUrl', 'vcs_url'],
        ['FileName', 'file_name'],
        ['Checksum', 'checksum']
      ].forEach(function ([name, expectedValue]) {
        it(`maps: ${name} => ${expectedValue}`, function () {
          assert.strictEqual(PackageURL.KnownQualifierNames[name], expectedValue);
        });
      });
    });

    it('readonly: cannot be written', function () {
      PackageURL.KnownQualifierNames = {foo: 'bar'};
      assert.notDeepStrictEqual(PackageURL.KnownQualifierNames, {foo: 'bar'})
    });

    it('frozen: cannot be modified', function () {
      PackageURL.KnownQualifierNames.foo = 'bar';
      assert.strictEqual(PackageURL.KnownQualifierNames.foo, undefined)
    });
  });
});
