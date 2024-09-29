import dbConnect from "@/utils/dbConnect";
import userlink from "@/models/userlink";

const delay = (ms: number | undefined) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request) {
  try {
    await dbConnect();
    await delay(3000);
    const userlinks = await userlink.find({});
    return Response.json(JSON.stringify(userlinks));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "error" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { autolink, address, message, signature } = body;

  try {
    await dbConnect();
    console.log("connected");

    await delay(3000);

    if (signature === true) {
      const res = await userlink.updateOne({ autolink: autolink }, { address: address });
      return Response.json(JSON.stringify(res));
    } else {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: error }, { status: 400 });
  }
}
