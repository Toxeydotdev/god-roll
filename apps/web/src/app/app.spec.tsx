import { render } from "@testing-library/react";

import App from "./app";

describe("App", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it("should render the dice roller", () => {
    const { container } = render(<App />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });
});
