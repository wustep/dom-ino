import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const targetUrl = req.query.url
	if (!targetUrl || typeof targetUrl !== "string") {
		res.status(400).json({ error: "Missing ?url= parameter" })
		return
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.9",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(15000),
		})

		const html = await response.text()
		res.setHeader("Content-Type", "text/html; charset=utf-8")
		res.setHeader("Access-Control-Allow-Origin", "*")
		res.status(200).send(html)
	} catch (e) {
		res.status(502).json({ error: String(e) })
	}
}
