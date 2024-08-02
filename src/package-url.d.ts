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

declare module "packageurl-js" {

  /**
   * A purl or package URL is an attempt to standardize existing approaches to reliably identify and locate software packages.
   * A purl is a URL string used to identify and locate a software package in a mostly universal and uniform way across
   * programming languages, package managers, packaging conventions, tools, APIs and databases. Such a package URL is
   * useful to reliably reference the same software package using a simple and expressive syntax and conventions based
   * on familiar URLs.
   */
  class PackageURL {

    /**
     * Collection of PURL component encode, normalize, and validate methods.
     * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component specification}
     */
    static Component: Readonly<{
      encode: Readonly<{
        type: (type: any) => string,
        namespace: (namespace: any) => string,
        name: (name: any) => string,
        version: (version: any) => string,
        qualifiers: (qualifiers: any) => string,
        subpath: (subpath: any) => string
      }>,
      normalize: Readonly<{
        type: (type: any) => string | undefined,
        namespace: (namespace: string) => string | undefined,
        name: (name: any) => string | undefined,
        version: (version: any) => string | undefined,
        qualifiers: (qualifiers: any) => { [key: string]: string } | undefined,
        subpath: (subpath: any) => string | undefined
      }>,
      validate: Readonly<{
        type: (type: any, throws: boolean) => boolean
        qualifierKey: (key: any, throws: boolean) => boolean
        qualifiers: (qualifiers: any, throws: boolean) => boolean
      }>
    }>

    /**
     * Known qualifiers names.
     * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#known-qualifiers-keyvalue-pairs specification}
     */
    static KnownQualifierNames: Readonly<{
      RepositoryUrl:'repository_url',
      DownloadUrl: 'download_url',
      VcsUrl: 'vcs_url',
      FileName: 'file_name',
      Checksum: 'checksum'
    }>

    /**
     * Collection of PURL type normalize and validate methods.
     * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst specification}
     */
    static Type: Readonly<{
      normalize: Readonly<{
        alpm: <T extends PackageURL>(purl: T) => T
        apk: <T extends PackageURL>(purl: T) => T
        bitbucket: <T extends PackageURL>(purl: T) => T
        bitnami: <T extends PackageURL>(purl: T) => T
        composer: <T extends PackageURL>(purl: T) => T
        deb: <T extends PackageURL>(purl: T) => T
        gitlab: <T extends PackageURL>(purl: T) => T
        github: <T extends PackageURL>(purl: T) => T
        golang: <T extends PackageURL>(purl: T) => T
        hex:  <T extends PackageURL>(purl: T) => T
        huggingface: <T extends PackageURL>(purl: T) => T
        mlflow: <T extends PackageURL>(purl: T) => T
        npm: <T extends PackageURL>(purl: T) => T
        luarocks: <T extends PackageURL>(purl: T) => T
        oci: <T extends PackageURL>(purl: T) => T
        pub: <T extends PackageURL>(purl: T) => T
        pypi: <T extends PackageURL>(purl: T) => T
        qpkg: <T extends PackageURL>(purl: T) => T
        rpm: <T extends PackageURL>(purl: T) => T
      }>
      validate: Readonly<{
        conan: (purl: PackageURL, throws: boolean) => boolean
        cran: (purl: PackageURL, throws: boolean) => boolean
        golang: (purl: PackageURL, throws: boolean) => boolean
        maven: (purl: PackageURL, throws: boolean) => boolean
        mlflow: (purl: PackageURL, throws: boolean) => boolean
        oci: (purl: PackageURL, throws: boolean) => boolean
        pub: (purl: PackageURL, throws: boolean) => boolean
        swift: (purl: PackageURL, throws: boolean) => boolean
      }>
    }>

    /**
     *  The package "type" or package "protocol" such as maven, npm, nuget, gem, pypi, etc. Required.
     */
    type: string

    /**
     * Some name prefix such as a Maven groupid, a Docker image owner, a GitHub user or organization. Optional and type-specific.
     */
    namespace: string | undefined

    /**
     * The name of the package. Required.
     */
    name: string

    /**
     * The version of the package. Optional.
     */
    version: string | undefined

    /**
     * Extra qualifying data for a package such as an OS, architecture, a distro, etc. Optional and type-specific.
     */
    qualifiers: { [key: string]: string } | undefined

    /**
     * Extra subpath within a package, relative to the package root. Optional.
     */
    subpath: string | undefined;

    constructor(
      type: string,
      namespace: string | undefined | null,
      name: string,
      version?: string | undefined | null,
      qualifiers?: { [key: string]: string; } | undefined | null,
      subpath?: string | undefined | null
    );

    /**
     * Converts the PackageURL to a string.
     */
    toString(): string

    /**
     * Parses a purl string into a PackageURL instance.
     * @param purlStr string to parse
     */
    static fromString(purlStr: string): PackageURL

    /**
     * Parses a purl string a PackageURL arguments array.
     * @param purlStr string to parse
     */
    static parseString(purlStr: string): [
      type: string,
      namespace: string | undefined,
      name: string,
      version: string | undefined,
      qualifiers: { [key: string]: string; } | undefined,
      subpath: string | undefined
    ]
  }
}
