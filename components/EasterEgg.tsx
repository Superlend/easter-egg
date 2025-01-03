"use client";

import { FormEvent, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/typography";
import { Input } from "./ui/input";
import { useActiveAccount } from "thirdweb/react";
import ConnectWalletButton from "./ConnectWalletButton";
import toast from "react-hot-toast";
import { validEmail } from "@/lib/utils";
import Confetti from "react-confetti";
import { usePathname, useRouter } from "next/navigation";
import useDimensions from "@/hooks/useDimensions";
import axios from "axios";
import { LoaderCircle } from "lucide-react";

const fakeCheatCodes = process.env.NEXT_PUBLIC_EASTER_EGG_CHEAT_CODES?.split(",") || [];
const realCheatCode = process.env.NEXT_PUBLIC_EASTER_EGG_ONE_SECRET_CODE || "";

const EasterEgg = () => {
	const [inputSequence, setInputSequence] = useState("");
	const [isModalOpen, setModalOpen] = useState(false);

	const pathname = usePathname();
	const activeAccount = useActiveAccount();
	const walletAddress = activeAccount?.address;
	const formattedAddress = walletAddress?.slice(0, 6) + "..." + walletAddress?.slice(-4);

	const [email, setEmail] = useState("");
	const [isEmailDisabled, setEmailDisabled] = useState(false);
	const [isEasterEggUnlocked, setEasterEggUnlocked] = useState(false);
	const [isEasterEggSolved, setEasterEggSolved] = useState(false);

	const isValidEmail = validEmail(email);
	const router = useRouter();
	const { width: screenWidth, height: screenHeight } = useDimensions();

	const [isCreatingUser, setIsCreatingUser] = useState(false);
	const [isLoadingUser, setIsLoadingUser] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			setInputSequence((prev) => {
				if (!/^[a-zA-Z]$/.test(event.key)) return prev;

				const maxLength = Math.max(
					...(fakeCheatCodes.map((code) => code.length) || [0]),
					realCheatCode.length || 0
				);

				const updatedSequence = (prev + event.key.toLowerCase()).slice(-maxLength);
				return updatedSequence;
			});
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	useEffect(() => {
		if (isModalOpen) return;
		if (!inputSequence) return;
		if (pathname === "/easter-egg") return;

		if (fakeCheatCodes.some((code) => inputSequence.includes(code))) {
			setInputSequence("");
			toast.success("Cheat Activated!", { duration: 2000 });
			setTimeout(() => {
				router.push("/easter-egg-not-found");
			}, 2000);

			return;
		}

		if (inputSequence.includes(realCheatCode)) {
			if (isEasterEggSolved) {
				setInputSequence("");
				setModalOpen(false);
				toast("You have already solved the quest.\nStay tuned for more quests!", {
					duration: 5000,
				});
			} else {
				toast.success("Cheat Activated!", { duration: 2000 });
				setInputSequence("");
				setTimeout(() => {
					setModalOpen(true);
				}, 2000);
			}
		}
	}, [inputSequence, isEasterEggSolved, isModalOpen, pathname, router]);

	useEffect(() => {
		setInputSequence("");
		if (walletAddress) {
			setIsLoadingUser(true);
			axios
				.get(`/api/get-entries?walletAddress=${walletAddress}`)
				.then((res) => {
					const user = res.data;

					if (user.email) {
						setEmail(user.email);
						setEmailDisabled(true);
						setEasterEggUnlocked(user.easterEggUnlocked);
						setEasterEggSolved(user.easterEggSolved);
						setIsLoadingUser(false);
					} else if (user.message === "Entry not found.") {
						setEmail("");
						setEmailDisabled(false);
						setEasterEggUnlocked(false);
						setEasterEggSolved(false);
						setIsLoadingUser(false);
					} else {
						console.error("Unexpected response:", user);
						setIsLoadingUser(false);
					}
				})
				.catch((err) => {
					console.error("Error fetching entry:", err);
					setIsLoadingUser(false);
				});
		}
	}, [walletAddress]);

	// Exit early if on "/easter-egg"
	if (pathname === "/easter-egg") {
		return null;
	}

	const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!isValidEmail) {
			toast.error("Please enter a valid email address.");
			return;
		}
		if (!walletAddress) {
			toast.error("Wallet address is required.");
			return;
		}
		if (isEasterEggUnlocked && !isEasterEggSolved) {
			document.cookie = "accessEasterEgg=true;";
			router.push("/easter-egg");
			setModalOpen(false);
			return;
		}

		if (isEasterEggUnlocked && isEasterEggSolved) {
			setModalOpen(false);
			toast("You have already solved the quest.\nStay tuned for more quests!", {
				duration: 5000,
			});
			return;
		}

		try {
			setIsCreatingUser(true);
			const response = await axios.post("/api/create-entry", {
				email,
				walletAddress,
			});

			if (response.status === 200) {
				setIsCreatingUser(false);
				document.cookie = "accessEasterEgg=true;";
				router.push("/easter-egg");
				setModalOpen(false);
			} else {
				setIsCreatingUser(false);
				toast.error("Something went wrong. Please try again later.");
			}
		} catch (error: any) {
			setIsCreatingUser(false);
			if (error.response?.status === 409) {
				if (error.response?.data?.message === "Email already exists.") {
					toast.error("Email already exists.");
					return;
				}
				if (error.response?.data?.message === "Wallet already exists.") {
					toast.error("Wallet already exists.");
				}
			} else {
				toast.error("Something went wrong. Please try again later.");
			}
		}
	};

	return (
		<div>
			<Dialog open={isModalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
					{isLoadingUser ? (
						<LoaderCircle className="mx-auto animate-spin" />
					) : (
						<>
							<Confetti
								className="absolute translate-x-[-50%] !left-[50%] translate-y-[-50%] !top-[50%]"
								width={screenWidth}
								height={screenHeight}
								numberOfPieces={500}
								tweenDuration={10000}
								recycle={false}
							/>
							<>
								<DialogHeader>
									<DialogTitle>Congratulations 🎉</DialogTitle>
									<DialogDescription>You have found a new quest.</DialogDescription>
								</DialogHeader>
								{!walletAddress ? (
									<div className="flex flex-col items-center gap-y-4">
										<DialogHeader>Connect your wallet to proceed</DialogHeader>
										<ConnectWalletButton />
									</div>
								) : (
									<form onSubmit={handleOnSubmit}>
										<div className="grid gap-4 py-4">
											<div className="grid grid-cols-4 items-center gap-4">
												<Label htmlFor="wallet-address" className="text-right">
													Wallet
												</Label>
												<Input
													title={walletAddress}
													id="wallet-address"
													defaultValue={formattedAddress}
													disabled
													className="col-span-3 bg-slate-200"
												/>
											</div>
											<div className="grid grid-cols-4 items-center gap-4">
												<Label htmlFor="email" className="text-right">
													Email
												</Label>
												<Input
													id="email"
													value={email}
													onChange={(e) => setEmail(e.target.value)}
													disabled={isEmailDisabled}
													className="col-span-3 focus-visible:ring-0 focus-visible:ring-offset-0"
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="primary"
												type="submit"
												disabled={isCreatingUser}
												className="mx-auto text-sm w-[165px] h-10 overflow-hidden"
											>
												{isCreatingUser ? <LoaderCircle className="animate-spin" /> : "Continue"}
											</Button>
										</DialogFooter>
									</form>
								)}
							</>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EasterEgg;
