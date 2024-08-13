# packageurl-js

### Installing:
To install `packageurl-js` in your project, simply run:
```
npm install packageurl-js
```

This command will download the `packageurl-js` npm package for use in your application.

### Local Development:
Clone the `packageurl-js` repo and `cd` into the directory.

Then run:
```
npm install
```

### Testing
To run the test suite:
```
npm test
```

### Usage Examples

#### Import ES6 Module

```
import { PackageURL } from 'packageurl-js'
```

#### Import CommonJs Module

```
const { PackageURL } = require('packageurl-js')
```

#### Parsing a string

```js
const purlStr = 'pkg:maven/org.springframework.integration/spring-integration-jms@5.5.5'
console.log(PackageURL.fromString(purlStr))
console.log(new PackageURL(...PackageURL.parseString(purlStr)))
```

will both log

```
PackageURL {
  type: 'maven',
  name: 'spring-integration-jms',
  namespace: 'org.springframework.integration',
  version: '5.5.5',
  qualifiers: undefined,
  subpath: undefined
}
```

#### Constructing

```js
const pkg = new PackageURL(
    'maven',
    'org.springframework.integration',
    'spring-integration-jms',
    '5.5.5'
)
console.log(pkg.toString())
```

will log

```
pkg:maven/org.springframework.integration/spring-integration-jms@5.5.5
```

#### Error Handling

```js
try {
    PackageURL.fromString('not-a-purl')
} catch (e) {
    console.error(e.message)
}
```

will log

```
Invalid purl: missing required "pkg" scheme component
```
