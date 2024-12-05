import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const dbName = process.env.MONGODB_DB_NAME as string;
const collectionName = process.env.MONGODB_COLLECTION_NAME as string;

export async function POST(request: Request) {
	try {
		const client = await clientPromise;
		const db = client.db(dbName);
		const collection = db.collection(collectionName);

		const {
			email,
			walletAddress,
			easterEggUnlocked = true,
			easterEggSolved = false,
		} = await request.json();

		if (!email || !walletAddress) {
			return NextResponse.json({ message: "Email and wallet address are required." }, { status: 400 });
		}

		const existingWallet = await collection.findOne({ walletAddress });
		if (existingWallet) {
			return NextResponse.json({ message: "Wallet already exists." }, { status: 409 });
		}

		const existingEmail = await collection.findOne({ email });
		if (existingEmail) {
			return NextResponse.json({ message: "Email already exists." }, { status: 409 });
		}

		const newEntry = {
			email,
			walletAddress,
			easterEggUnlocked,
			easterEggSolved,
			createdAt: new Date(),
		};

		await collection.insertOne(newEntry);

		return NextResponse.json({ message: "Entry added successfully." });
	} catch (error) {
		console.error("Error adding entry:", error);
		return NextResponse.json({ message: "Internal server error." }, { status: 500 });
	}
}
