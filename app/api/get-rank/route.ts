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

		const totalSolved = await collection.countDocuments({ easterEggSolved: true });
		const userRank = totalSolved + 1;

		return NextResponse.json({ rank: userRank, totalSolved });
	} catch (error) {
		console.error("Error fetching rank:", error);
		return NextResponse.json({ message: "Internal server error." }, { status: 500 });
	}
}
