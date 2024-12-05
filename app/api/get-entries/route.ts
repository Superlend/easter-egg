import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const dbName = process.env.MONGODB_DB_NAME as string;
const collectionName = process.env.MONGODB_COLLECTION_NAME as string;

export async function GET(request: Request) {
	try {
		const client = await clientPromise;
		const db = client.db(dbName);
		const collection = db.collection(collectionName);

		const { searchParams } = new URL(request.url);
		const walletAddress = searchParams.get("walletAddress");

		if (!walletAddress) {
			return NextResponse.json({ message: "Wallet address is required." }, { status: 400 });
		}

		const entry = await collection.findOne({ walletAddress });

		if (entry) {
			return NextResponse.json(entry);
		} else {
			return NextResponse.json({ message: "Entry not found." });
		}
	} catch (error) {
		console.error("Error fetching entries:", error);
		return NextResponse.json({ message: "Internal server error." }, { status: 500 });
	}
}
