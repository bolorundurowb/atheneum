Run component/service logic tests with `npm test` using Node 24 or newer. The
test loader transpiles application TypeScript with the existing TypeScript
dependency and resolves Ionic's extensionless imports. Tests use real Angular
dependency injection and RxJS, with injected service or HTTP test doubles.

These tests do not render templates or simulate a native device. Run
`npm run build` for TypeScript/template checking and `npm run lint` alongside
them; use a browser or device for visual and native interaction checks.
