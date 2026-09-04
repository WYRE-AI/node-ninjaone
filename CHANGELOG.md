## [2.1.1](https://github.com/WYRE-AI/node-ninjaone/compare/v2.1.0...v2.1.1) (2026-09-04)


### Bug Fixes

* **security:** resolve dependabot alerts via npm audit fix ([#81](https://github.com/WYRE-AI/node-ninjaone/issues/81)) ([b55ab88](https://github.com/WYRE-AI/node-ninjaone/commit/b55ab880e7825c02964d697e2cb459d3775bb2a8))


# [2.1.0](https://github.com/WYRE-AI/node-ninjaone/compare/v2.0.4...v2.1.0) (2026-08-30)


### Features

* add organization custom fields support ([#78](https://github.com/WYRE-AI/node-ninjaone/issues/78)) ([0935828](https://github.com/WYRE-AI/node-ninjaone/commit/09358281db95c96ea1fbf19e9b46a620ff189390))

## [2.0.4](https://github.com/WYRE-AI/node-ninjaone/compare/v2.0.3...v2.0.4) (2026-08-28)


### Bug Fixes

* **http:** stop mapping generic 400s to NinjaOneAuthenticationError ([#77](https://github.com/WYRE-AI/node-ninjaone/issues/77)) ([058b56e](https://github.com/WYRE-AI/node-ninjaone/commit/058b56ef06370a6900e2617c64973d6c7c69d44e)), closes [#51](https://github.com/WYRE-AI/node-ninjaone/issues/51)

## [2.0.3](https://github.com/WYRE-AI/node-ninjaone/compare/v2.0.2...v2.0.3) (2026-08-25)


### Bug Fixes

* **deps:** ignore undici in dependabot -- nested unreachable copy in npm's bundled tree ([#74](https://github.com/WYRE-AI/node-ninjaone/issues/74)) ([7121815](https://github.com/WYRE-AI/node-ninjaone/commit/712181547bcb22f2e1bb49f8f881333c3646d653))
* migrate to WYRE-AI org (npm scope, ghcr namespace, registry) ([#76](https://github.com/WYRE-AI/node-ninjaone/issues/76)) ([51e8e19](https://github.com/WYRE-AI/node-ninjaone/commit/51e8e19450f08fe3558eb5a7ebde43850529a0ac))

## [2.0.2](https://github.com/wyre-technology/node-ninjaone/compare/v2.0.1...v2.0.2) (2026-08-13)


### Bug Fixes

* **deps:** ignore unreachable ip-address advisory in dependabot config ([#66](https://github.com/wyre-technology/node-ninjaone/issues/66)) ([984be29](https://github.com/wyre-technology/node-ninjaone/commit/984be29102dbdb3605f60173fcdf747f6aa9c5e3))

## [2.0.1](https://github.com/wyre-technology/node-ninjaone/compare/v2.0.0...v2.0.1) (2026-07-05)


### Bug Fixes

* **devices:** compile list() filters into df expression ([#50](https://github.com/wyre-technology/node-ninjaone/issues/50)) ([6f2e661](https://github.com/wyre-technology/node-ninjaone/commit/6f2e6616e42ee79f6f439bd79a546cab94b78bbb)), closes [wyre-technology/ninjaone-mcp#56](https://github.com/wyre-technology/ninjaone-mcp/issues/56)

# [2.0.0](https://github.com/wyre-technology/node-ninjaone/compare/v1.1.3...v2.0.0) (2026-07-04)


* fix!: remove silent boardId=1 fallback in tickets.list() ([#49](https://github.com/wyre-technology/node-ninjaone/issues/49)) ([288ed82](https://github.com/wyre-technology/node-ninjaone/commit/288ed823a30e8c2c14f3de7a35066a1ecf3fd242)), closes [wyre-technology/ninjaone-mcp#54](https://github.com/wyre-technology/ninjaone-mcp/issues/54)


### BREAKING CHANGES

* TicketsResource.list() requires params.boardId; calls
without it throw instead of silently defaulting to board 1.

## [1.1.3](https://github.com/wyre-technology/node-ninjaone/compare/v1.1.2...v1.1.3) (2026-06-08)


### Bug Fixes

* **security:** bump vitest + @vitest/coverage-v8 1.x -> 3.2.6 ([#26](https://github.com/wyre-technology/node-ninjaone/issues/26)) ([f9dbb5e](https://github.com/wyre-technology/node-ninjaone/commit/f9dbb5eb7fc3c1ae6651b273c0cf583ebd0877e6))

## [1.1.2](https://github.com/wyre-technology/node-ninjaone/compare/v1.1.1...v1.1.2) (2026-05-28)


### Bug Fixes

* **tickets:** correct filter field names and value shapes for list() ([#16](https://github.com/wyre-technology/node-ninjaone/issues/16)) ([73f0b8a](https://github.com/wyre-technology/node-ninjaone/commit/73f0b8a63105f0e17bffba9150dc203cab9f4acb)), closes [#15](https://github.com/wyre-technology/node-ninjaone/issues/15)

## [1.1.1](https://github.com/wyre-technology/node-ninjaone/compare/v1.1.0...v1.1.1) (2026-05-20)


### Bug Fixes

* correct packaging exports so CJS/ESM consumers resolve ([#3](https://github.com/wyre-technology/node-ninjaone/issues/3)) ([1f23f92](https://github.com/wyre-technology/node-ninjaone/commit/1f23f925530122d1d1eae154a8dbecd75f72d1cd))

# [1.1.0](https://github.com/wyre-technology/node-ninjaone/compare/v1.0.2...v1.1.0) (2026-03-31)


### Features

* add Canada, US2, and Federal region support ([20a83e9](https://github.com/wyre-technology/node-ninjaone/commit/20a83e9d842810571a0b3a77444fffa3cc6bea29))

## [1.0.2](https://github.com/wyre-technology/node-ninjaone/compare/v1.0.1...v1.0.2) (2026-03-26)


### Bug Fixes

* parse JSON response body regardless of content-type header ([a5566d5](https://github.com/wyre-technology/node-ninjaone/commit/a5566d570583beb189bee19a7fadf953a07bc2a6)), closes [msp-claude-plugins#22](https://github.com/msp-claude-plugins/issues/22)

## [1.0.1](https://github.com/wyre-technology/node-ninjaone/compare/v1.0.0...v1.0.1) (2026-02-21)


### Bug Fixes

* correct ticketing API endpoints and HTTP response body handling ([6054b0a](https://github.com/wyre-technology/node-ninjaone/commit/6054b0a4efa42f799c4f0ca591128f238cefc7b6))

# 1.0.0 (2026-02-17)


### Bug Fixes

* update package scope from [@asachs01](https://github.com/asachs01) to [@wyre-technology](https://github.com/wyre-technology) ([0fd9864](https://github.com/wyre-technology/node-ninjaone/commit/0fd98641f03be445aa69f44ec53d2f705ffa3b46))


### Features

* **ci:** add release workflow with semantic-release and GitHub Packages publishing ([c99742f](https://github.com/wyre-technology/node-ninjaone/commit/c99742f1de65043af2b5eae384a5867fb6cddcb4))
* Initial implementation of @asachs01/node-ninjaone ([4747bc4](https://github.com/wyre-technology/node-ninjaone/commit/4747bc489ff89b75095e3f151d67606056b892d2))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @asachs01/node-ninjaone
- Full TypeScript support with comprehensive type definitions
- OAuth 2.0 authentication with automatic token refresh
- Support for all three regional endpoints (US, EU, Oceania)
- Built-in rate limiting with configurable thresholds
- Organizations resource (list, get, create, update, delete)
- Devices resource (list, get, update, reboot, services, software, inventory)
- Alerts resource (list, get, delete, reset)
- Tickets resource (list, get, create, update, delete, comments)
- Webhooks resource (list, get, create, update, delete)
- Automatic retry logic for rate limits and server errors
- Comprehensive error classes for different error conditions
- Full test suite with unit and integration tests using Vitest and MSW
