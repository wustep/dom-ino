import type { VercelRequest, VercelResponse } from "@vercel/node"

const RESET_HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Resetting DOMino...</title>
	</head>
	<body>
		<script>
			try {
				localStorage.clear();
			} catch {}
			window.location.replace("/");
		</script>
	</body>
</html>
`

export default function handler(_req: VercelRequest, res: VercelResponse) {
	res.setHeader("Content-Type", "text/html; charset=utf-8")
	res.status(200).send(RESET_HTML)
}
