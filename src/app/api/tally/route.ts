import dbConnect from "@/utils/dbConnect";
import createlink from "../../../models/createlink";
import tallylink from "../../../models/tallylink";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const autolink = req.nextUrl.searchParams.get("autolink");
    try {
        await dbConnect();
        const tallylinks = await tallylink.findOne({ tallylink: autolink });

        return Response.json(JSON.stringify(tallylinks));
    } catch (error) {
        console.error(error);
        return Response.json({ error: "error" }, { status: 400 });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { autolink, transactionHash, network, finished, voteId } = body;
    try {
        await dbConnect();

        const res = await tallylink.updateOne(
            { tallylink: autolink },
            { transactionHash: transactionHash, network: network }
        );

        await createlink.updateOne(
            { voteId: voteId },
            { finished: finished }
        );

        return Response.json(JSON.stringify(res));

    } catch (error) {
        console.error(error);
        return Response.json({ error: error }, { status: 400 });
    }
}