import "@testing-library/jest-dom/vitest"

// Node ≥ 25 ships Web Storage globals that are `undefined` unless
// `--localstorage-file` is passed, and they shadow jsdom's implementations.
// Point the globals back at jsdom's Storage so component tests can persist state.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window
if (jsdomWindow) {
	for (const key of ["localStorage", "sessionStorage"] as const) {
		if (globalThis[key] === undefined) {
			Object.defineProperty(globalThis, key, {
				configurable: true,
				enumerable: true,
				get: () => jsdomWindow[key],
			})
		}
	}
}
