import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { handleFetchPageRequest } from "./api/_lib/fetchProxy.ts"

/** Dev-server mirror of the `api/fetch-page.ts` Vercel function (same implementation). */
function fetchProxyPlugin(): Plugin {
	return {
		name: "fetch-proxy",
		configureServer(server) {
			server.middlewares.use("/api/fetch-page", async (req, res) => {
				const url = new URL(req.url ?? "/", "http://localhost")
				const result = await handleFetchPageRequest({
					url: url.searchParams.get("url"),
					asset: url.searchParams.get("asset"),
					archive: url.searchParams.get("archive"),
				})
				res.writeHead(result.status, result.headers)
				res.end(result.body)
			})
		},
	}
}

export default defineConfig({
	plugins: [react(), fetchProxyPlugin()],
	server: { port: 5173 },
})
