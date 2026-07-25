// Runs once before each jsdom-project test file. Registers the custom DOM
// matchers (toBeInTheDocument, toHaveAttribute, toHaveTextContent, ...) from
// @testing-library/jest-dom so component tests can assert on rendered output.
import "@testing-library/jest-dom/vitest";
