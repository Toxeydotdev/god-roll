import { vi } from "vitest";

// Mock WebGL context
class MockWebGLRenderingContext {
  canvas = document.createElement("canvas");
  getExtension = vi.fn(() => null);
  getParameter = vi.fn(() => 0);
  getShaderPrecisionFormat = vi.fn(() => ({
    precision: 1,
    rangeMin: 1,
    rangeMax: 1,
  }));
  createShader = vi.fn(() => ({}));
  shaderSource = vi.fn();
  compileShader = vi.fn();
  getShaderParameter = vi.fn(() => true);
  createProgram = vi.fn(() => ({}));
  attachShader = vi.fn();
  linkProgram = vi.fn();
  getProgramParameter = vi.fn(() => true);
  useProgram = vi.fn();
  createBuffer = vi.fn(() => ({}));
  bindBuffer = vi.fn();
  bufferData = vi.fn();
  createTexture = vi.fn(() => ({}));
  bindTexture = vi.fn();
  texImage2D = vi.fn();
  texParameteri = vi.fn();
  activeTexture = vi.fn();
  enable = vi.fn();
  disable = vi.fn();
  blendFunc = vi.fn();
  clearColor = vi.fn();
  clear = vi.fn();
  viewport = vi.fn();
  drawArrays = vi.fn();
  drawElements = vi.fn();
  getUniformLocation = vi.fn(() => ({}));
  getAttribLocation = vi.fn(() => 0);
  enableVertexAttribArray = vi.fn();
  vertexAttribPointer = vi.fn();
  uniform1f = vi.fn();
  uniform1i = vi.fn();
  uniform2f = vi.fn();
  uniform3f = vi.fn();
  uniform4f = vi.fn();
  uniformMatrix4fv = vi.fn();
  createFramebuffer = vi.fn(() => ({}));
  bindFramebuffer = vi.fn();
  framebufferTexture2D = vi.fn();
  createRenderbuffer = vi.fn(() => ({}));
  bindRenderbuffer = vi.fn();
  renderbufferStorage = vi.fn();
  framebufferRenderbuffer = vi.fn();
  checkFramebufferStatus = vi.fn(() => 36053); // FRAMEBUFFER_COMPLETE
  deleteShader = vi.fn();
  deleteProgram = vi.fn();
  deleteBuffer = vi.fn();
  deleteTexture = vi.fn();
  deleteFramebuffer = vi.fn();
  deleteRenderbuffer = vi.fn();
  pixelStorei = vi.fn();
  generateMipmap = vi.fn();
  flush = vi.fn();
  finish = vi.fn();
  scissor = vi.fn();
  cullFace = vi.fn();
  frontFace = vi.fn();
  depthFunc = vi.fn();
  depthMask = vi.fn();
  depthRange = vi.fn();
  stencilFunc = vi.fn();
  stencilMask = vi.fn();
  stencilOp = vi.fn();
  colorMask = vi.fn();
  blendEquation = vi.fn();
  blendEquationSeparate = vi.fn();
  blendFuncSeparate = vi.fn();
  lineWidth = vi.fn();
  polygonOffset = vi.fn();
  sampleCoverage = vi.fn();
  readPixels = vi.fn();
  drawingBufferWidth = 800;
  drawingBufferHeight = 600;
}

// Store original getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;

// Setup function to be called before tests
export function setupWebGLMock() {
  HTMLCanvasElement.prototype.getContext = function (
    contextId: string,
    options?: unknown
  ) {
    if (contextId === "webgl" || contextId === "webgl2") {
      return new MockWebGLRenderingContext() as unknown as RenderingContext;
    }
    return originalGetContext.call(
      this,
      contextId,
      options as CanvasRenderingContext2DSettings
    );
  };
}

// Cleanup function to be called after tests
export function cleanupWebGLMock() {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
}

// Mock localStorage
export function setupLocalStorageMock() {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  return mockLocalStorage;
}
