# App tests

Run `npm test` (or `npx ng test`) for Angular unit tests. Run
`npm test -- --watch=false` for a single run, as CI does.

The Angular CLI `@angular/build:unit-test` target uses Vitest and jsdom. Put
TypeScript specs beside their source files as `*.spec.ts`. Angular initializes
TestBed and compiles components and templates through its standard test builder.

The `test-build` target supplies the application options needed by that builder;
it does not change the production Webpack build. Run `npm run build` and
`npm run lint` alongside tests. Device behavior still requires browser/device
validation.
