import { afterEach, describe, expect, it } from "vitest"
import { cloneWithInlineStyles, normalizeCloneRoot } from "./ImportedPhysicsClone"

function mountSource(html: string, style: string): HTMLElement {
	const source = document.createElement("div")
	source.setAttribute("style", style)
	source.innerHTML = html
	document.body.appendChild(source)
	return source
}

describe("cloneWithInlineStyles", () => {
	afterEach(() => {
		document.body.innerHTML = ""
		delete (window as { __cloned?: number }).__cloned
	})

	// Regression: every descendant got margin:0 and box-sizing:border-box, so
	// thrown cards collapsed their spacing and shrank padded children.
	it("keeps descendants' own margins and box-sizing", () => {
		const source = mountSource(
			`<h3 style="margin: 0px 0px 20px">Title</h3><p style="margin: 15px 0px; padding: 10px; box-sizing: content-box; width: 200px">Body</p>`,
			"padding: 12px",
		)
		const clone = cloneWithInlineStyles(source, window, document) as HTMLElement
		const h3 = clone.querySelector("h3")!
		const p = clone.querySelector("p")!
		expect(h3.style.marginBottom).toBe("20px")
		expect(p.style.marginTop).toBe("15px")
		expect(p.style.boxSizing).toBe("content-box")
		expect(p.style.width).toBe("200px")
	})

	// Regression: a <script> recreated with createElement executes when the
	// clone is inserted into the app document; <style> would restyle the app.
	it("never recreates scripts or stylesheets", () => {
		const source = mountSource(
			`<p>ok</p><script>window.__cloned = 1</script><style>body { color: red }</style><link rel="stylesheet" href="/x.css"><svg><script>window.__cloned = 2</script></svg>`,
			"",
		)
		const clone = cloneWithInlineStyles(source, window, document) as HTMLElement
		document.body.appendChild(clone)
		expect(clone.querySelector("script")).toBeNull()
		expect(clone.querySelector("style")).toBeNull()
		expect(clone.querySelector("link")).toBeNull()
		expect((window as { __cloned?: number }).__cloned).toBeUndefined()
	})

	// Regression: cloned <iframe>s loaded third-party pages, unsandboxed, in the app.
	it("replaces embedded browsing contexts with inert placeholders", () => {
		const source = mountSource(
			`<iframe src="https://example.com/" style="width: 200px; height: 40px"></iframe><embed src="x.swf"><object data="y"></object>`,
			"",
		)
		const clone = cloneWithInlineStyles(source, window, document) as HTMLElement
		expect(clone.querySelector("iframe, embed, object")).toBeNull()
		const placeholder = clone.firstElementChild as HTMLElement
		expect(placeholder.tagName).toBe("DIV")
		expect(placeholder.style.width).toBe("200px")
		expect(placeholder.getAttribute("src")).toBeNull()
	})
})

describe("normalizeCloneRoot", () => {
	// Regression: the wrapper is placed at getBoundingClientRect(), which already
	// includes transforms and offsets; keeping them pushed the copy out of its
	// overflow:hidden wrapper (centered badges, absolutely positioned boxes vanished).
	it("drops positioning that the wrapper already accounts for", () => {
		const root = document.createElement("div")
		root.setAttribute(
			"style",
			"position: absolute; top: 30px; left: 50%; transform: translateX(-50%); margin: 12px; float: left; max-width: 50%",
		)
		normalizeCloneRoot(root)
		expect(root.style.position).toBe("relative")
		expect(root.style.top).toBe("auto")
		expect(root.style.left).toBe("auto")
		expect(root.style.transform).toBe("none")
		expect(root.style.margin).toBe("0px")
		expect(root.style.cssFloat).toBe("none")
		expect(root.style.maxWidth).toBe("none")
		expect(root.style.width).toBe("100%")
		expect(root.style.height).toBe("100%")
	})
})
