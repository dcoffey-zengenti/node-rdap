# 0.5.0

Moved from yarn to pnpm
Moved from eslint to biome
Moved from jest to vitest
Changed where caches are instantiated to keep concerns seperate.
Dependency updates - @types/node, commander
Punycode replaced with an ES6/typescript version.
Node 20 or higher now required.

# 0.4.2

Dependency updates - @types/jest, @types/punycode, ts-node, ts-jest, typescript, commander, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, rimraf

Exported types from entry file.

# 0.4.1

Dependency updates - Typescript, typescript-eslint and various typings packages.

# 0.4.0

Replace got with native fetch.
Node 18 or higher now required.

# 0.3.6

Fixed accept header being limited to just `application/json`. `application/rdap+json` is now also allowed.

# 0.3.5

Fixed an issue with imports not working without the `--es-module-specifier-resolution=node` flag.

# 0.2.0

Changed the caching strategy for faster lookups of same IP/Domain/Autnum.

# 0.1.0

Beta Release v1

Added repository info to package json.

# 0.0.3

Now only available as ESM package.

Added Readme and Changelog.

# 0.0.2

Fixed npm not publishing build files.

# 0.0.1

Initial Release
