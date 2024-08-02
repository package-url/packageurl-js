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

  export type PurlQualifiers = { [key: string]: string }

  export type PurlComponentEncoder = (comp: any) => string

  export type PurlComponentQualifiersNormalizer = (comp: any) => PurlQualifiers | undefined

  export type PurlComponentStringNormalizer = (comp: any) => string | undefined

  export type PurlComponentValidator = (comp: any, throws: boolean) => boolean

  export type PurlTypNormalizer = <T extends PackageURL>(purl: T) => T

  export type PurlTypeValidater = (purl: PackageURL, throws: boolean) => boolean

  /**
   * Collection of PURL component encode, normalize, and validate methods.
   * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#rules-for-each-purl-component specification}
   */
  export type PurlComponentHelpers = ReadOnly<{
    encode: ReadOnly<{
      type: PurlComponentEncoder
      namespace: PurlComponentEncoder
      name: PurlComponentEncoder
      version: PurlComponentEncoder
      qualifiers: PurlComponentEncoder
      subpath: PurlComponentEncoder
    }>
    normalize: ReadOnly<{
      type: PurlComponentStringNormalizer
      namespace: PurlComponentStringNormalizer
      name: PurlComponentStringNormalizer
      version: PurlComponentStringNormalizer
      qualifiers: PurlComponentQualifiersNormalizer
      subpath: PurlComponentStringNormalizer
    }>
    validate: ReadOnly<{
      type: PurlComponentValidator
      qualifierKey: PurlComponentValidator
      qualifiers: PurlComponentValidator
    }>
  }>

  /**
   * Known qualifiers names.
   * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-SPECIFICATION.rst#known-qualifiers-keyvalue-pairs specification}
   */
  export type PurlQualifierNames = ReadOnly<{
    RepositoryUrl:'repository_url',
    DownloadUrl: 'download_url',
    VcsUrl: 'vcs_url',
    FileName: 'file_name',
    Checksum: 'checksum'
  }>

  /**
   * Collection of PURL type normalize and validate methods.
   * @see {@link https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst#known-purl-types specification}
   */
  export type PurlTypeHelpers = ReadOnly<{
    normalize: ReadOnly<{
      alpm: PurlTypNormalizer
      apk: PurlTypNormalizer
      bitbucket: PurlTypNormalizer
      bitnami: PurlTypNormalizer
      composer: PurlTypNormalizer
      deb: PurlTypNormalizer
      gitlab: PurlTypNormalizer
      github: PurlTypNormalizer
      golang: PurlTypNormalizer
      hex: PurlTypNormalizer
      huggingface: PurlTypNormalizer
      mlflow: PurlTypNormalizer
      npm: PurlTypNormalizer
      luarocks: PurlTypNormalizer
      oci: PurlTypNormalizer
      pub: PurlTypNormalizer
      pypi: PurlTypNormalizer
      qpkg: PurlTypNormalizer
      rpm: PurlTypNormalizer
    }>
    validate: ReadOnly<{
      conan: PurlTypeValidater
      cran: PurlTypeValidater
      golang: PurlTypeValidater
      maven: PurlTypeValidater
      mlflow: PurlTypeValidater
      oci: PurlTypeValidater
      pub: PurlTypeValidater
      swift: PurlTypeValidater
    }>
  }>

  export const Component = <PurlComponentHelpers>{}

  export const KnownQualifierNames = <PurlQualifierNames>{}

  export const Type = <PurlTypeHelpers>{}

  /**
   * A purl or package URL is an attempt to standardize existing approaches to reliably identify and locate software packages.
   * A purl is a URL string used to identify and locate a software package in a mostly universal and uniform way across
   * programming languages, package managers, packaging conventions, tools, APIs and databases. Such a package URL is
   * useful to reliably reference the same software package using a simple and expressive syntax and conventions based
   * on familiar URLs.
   */
  export class PackageURL {

    static Component: PurlComponentHelpers

    static KnownQualifierNames: PurlQualifierNames

    static Type: PurlTypeHelpers

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
    qualifiers: PurlQualifiers | undefined

    /**
     * Extra subpath within a package, relative to the package root. Optional.
     */
    subpath: string | undefined

    constructor(
      type: string,
      namespace: string | undefined | null,
      name: string,
      version?: string | undefined | null,
      qualifiers?: PurlQualifiers | undefined | null,
      subpath?: string | undefined | null
    )

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
      qualifiers: PurlQualifiers | undefined,
      subpath: string | undefined
    ]
  }
}
