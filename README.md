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
import { PackageURL } from 'packageurl-js';
```

#### Import CommonJs Module

```
const { PackageURL } = require('packageurl-js');
```

#### Parsing from a string

```
const pkg = PackageURL.fromString('pkg:maven/org.springframework.integration/spring-integration-jms@5.5.5');
console.log(pkg);
```

=>

```
PackageURL {
  type: 'maven',
  name: 'spring-integration-jms',
  namespace: 'org.springframework.integration',
  version: '5.5.5',
  qualifiers: null,
  subpath: null
}
```

#### Constructing

```
const pkg = new PackageURL(
    'maven',
    'org.springframework.integration',
    'spring-integration-jms',
    '5.5.5',
    undefined,
    undefined);

console.log(pkg.toString());
```

=>

```
pkg:maven/org.springframework.integration/spring-integration-jms@5.5.5
```

#### Error Handling

```
try {
    PackageURL.fromString('not-a-purl');
} catch(ex) {
    console.error(ex.message);
}
```

=>

```
purl is missing the required "pkg" scheme component.
```
