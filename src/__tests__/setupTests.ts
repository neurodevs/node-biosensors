import { JSDOM } from 'jsdom'

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
})

global.window = jsdom.window as unknown as Window & typeof globalThis
global.document = jsdom.window.document
global.navigator = jsdom.window.navigator
global.HTMLElement = jsdom.window.HTMLElement
global.getComputedStyle = jsdom.window.getComputedStyle

global.ResizeObserver = class {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
}

global.SVGElement = jsdom.window.SVGElement
