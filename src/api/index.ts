import { VercelRequest, VercelResponse } from "@vercel/node";

export async function GET(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        message: "API is working yayyyyy"
    })
}
