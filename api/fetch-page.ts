import type { VercelRequest, VercelResponse } from "@vercel/node"
import { handleFetchPageRequest } from "./_lib/fetchProxy.js"

function firstParam(value: string | string[] | undefined): string | null {
	if (Array.isArray(value)) return value[0] ?? null
	return value ?? null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.setHeader("Allow", "GET, HEAD")
		res.status(405).json({ error: "Method not allowed", code: "method_not_allowed" })
		return
	}
	const result = await handleFetchPageRequest({
		url: firstParam(req.query.url),
		asset: firstParam(req.query.asset),
		archive: firstParam(req.query.archive),
	})
	for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value)
	res.status(result.status).send(result.body)
}
