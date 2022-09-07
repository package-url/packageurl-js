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
   * A purl is a URL string used to identify and locate a software package in a mostly universal and uniform way across programing languages,
   * package managers, packaging conventions, tools, APIs and databases.
   * Such a package URL is useful to reliably reference the same software package using a simple and expressive syntax and conventions based on familiar URLs.
   */
  class PackageURL {

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
     *  the package "type" or package "protocol" such as maven, npm, nuget, gem, pypi, etc. Required.
     */
    type: string;

    /**
     * some name prefix such as a Maven groupid, a Docker image owner, a GitHub user or organization. Optional and type-specific.
     */
    namespace: string | undefined | null;

    /**
     * the name of the package. Required.
     */
    name: string;

    /**
     * the version of the package. Optional.
     */
    version: string | undefined | null;

    /**
     * extra qualifying data for a package such as an OS, architecture, a distro, etc. Optional and type-specific.
     */
    qualifiers: {
      [key: string]: string;
    } | undefined | null;

    /**
     * extra subpath within a package, relative to the package root. Optional.
     */
    subpath: string | undefined | null;

    constructor(type: string,
      namespace: string | undefined | null,
      name: string,
      version: string | undefined | null,
      qualifiers: { [key: string]: string; } | undefined | null,
      subpath: string | undefined | null);

    /**
     * Converts the PackageURL to a string
     */
    toString(): string;

    /**
     * Parses a string tp a PackageURL
     * @param purl string to parse
     */
    static fromString(purl: string): PackageURL

  }

}
