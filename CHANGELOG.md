# 1.0.0
### Features
* Add enum-like static readonly property `KnownQualifierNames` to reflect known qualifier names [#34](https://github.com/package-url/packageurl-js/pull/34)

# 0.0.7
### Bug Fixes
* Keep license texts in comment headers, even after minification [#27](https://github.com/package-url/packageurl-js/issues/27)
* Fix a bug in golang purls that was adding additional slashes to the string [#30](https://github.com/package-url/packageurl-js/issues/30)

# 0.0.6
### Bug Fixes
* Properly replace all underscore values for PyPI packages [#23](https://github.com/package-url/packageurl-js/issues/23)

# 0.0.5
### Changes
* update deps via `npm audit fix`

### Bug Fixes
* Handle forward slash in namespace for go purls

# 0.0.4
### Bug Fixes
* Properly handle PyPI `purl` values per the purl-spec [#18](https://github.com/package-url/packageurl-js/pull/18)

# 0.0.3
### Bug Fixes
* Properly handle `undefined` or `null` qualifier values [#16](https://github.com/package-url/packageurl-js/issues/16)

# 0.0.2

### Features
* TypeScript: type-definitions [#6](https://github.com/package-url/packageurl-js/issues/6)

Bug fixes
* fromString(): version is used outside of block scope [#5](https://github.com/package-url/packageurl-js/issues/5)
* fromString(): qualifiers extracted as string, constructor expects object [#7](https://github.com/package-url/packageurl-js/issues/7)

### BREAKING CHANGES

* the main module previously exported the PackageURL class directly
* this prevents that additional classes can be added in the future and doesn't work nicely together with the ES6 module system
* the root module now exports an object containing the classes

Before
```js
const PackageURL = require('packageurl-js');
```

After
```js
const PackageURL = require('packageurl-js').PackageURL;
// or
const { PackageURL } = require('packageurl-js');
// or ES6 / Typescript
import { PackageURL } from 'packageurl-js';
```

# 0.0.1

* Initial release
