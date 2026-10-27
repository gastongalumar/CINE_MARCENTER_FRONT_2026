# CINEMARCENTERFRONT2026

This project uses [Angular](https://angular.dev/) 22.

## Node.js

The project requires a Node.js version compatible with Angular 22: `^22.22.3`, `^24.15.0`, or `>=26.0.0`. With `fnm`, the project's Node version is selected automatically when you enter the project directory. Run `fnm install` from the project directory to install or refresh the latest version matching this range.

Install `fnm` on Windows if needed:

```powershell
winget install --id Schniz.fnm --exact --scope user
```

Add fnm to the PowerShell profile (once):

```powershell
if (-not (Select-String -Path $PROFILE -Pattern 'fnm env --use-on-cd' -Quiet -ErrorAction SilentlyContinue)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $PROFILE) | Out-Null
  Add-Content -Path $PROFILE -Value 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
}
```

Close and reopen PowerShell, then enter the project directory. fnm reads the `engines.node` range in `package.json` and switches to the selected compatible version. To install or refresh the latest compatible release manually from this directory:

```powershell
fnm install
fnm use
node -v
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
