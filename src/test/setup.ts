import "@testing-library/jest-dom";

// The game-core tests deliberately run with `environment: node` to prove the simulation
// needs no DOM, and this setup file runs there too — so nothing here may assume `window`.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
