import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const dbName = process.env.MONGODB_DB_NAME as string;
const collectionName = process.env.MONGODB_COLLECTION_NAME as string;

export async function POST(request: Request) {
	try {
		const { walletAddress } = await request.json();

		if (!walletAddress) {
			return NextResponse.json({ message: "Wallet address is required." }, { status: 400 });
		}

		const client = await clientPromise;
		const db = client.db(dbName);
		const collection = db.collection(collectionName);

		const result = await collection.updateOne({ walletAddress }, { $set: { easterEggSolved: true } });

		if (result.matchedCount === 0) {
			return NextResponse.json({ message: "Entry not found." }, { status: 404 });
		}

		if (result.modifiedCount > 0) {
			return NextResponse.json({ message: "Entry updated successfully." });
		} else {
			return NextResponse.json({ message: "Entry was already up-to-date." });
		}
	} catch (error) {
		console.error("Error updating entry:", error);
		return NextResponse.json({ message: "Internal server error." }, { status: 500 });
	}
}
