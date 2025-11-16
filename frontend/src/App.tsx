import { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import idlJson from "./idl/solain.json";
import Header from "./components/Header";
import InitializeWorkoutForm from "./InitializeWorkoutForm";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutList from "./WorkoutList";

const PROGRAM_ID = "2BqFVR96CLqZ6AHue5FbUCXFk4zdiASaoL97wND53BT3";

function App() {
  const [provider, setProvider] = useState<anchor.AnchorProvider | null>(null);
  const [walletPubkey, setWalletPubkey] = useState<PublicKey | null>(null);

  async function connectWallet() {
    if (!(window as any).solana) {
      alert("Please install Phantom wallet!");
      return;
    }
    try {
      const resp = await (window as any).solana.connect();
      const pubkey = new PublicKey(resp.publicKey.toString());
      setWalletPubkey(pubkey);

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const wallet = (window as any).solana;
      const prov = new AnchorProvider(connection, wallet, {
        preflightCommitment: "confirmed",
      });
      setProvider(prov);
    } catch (err) {
      console.error(err);
    }
  }

  async function disconnectWallet() {
    try {
      if ((window as any).solana) {
        await (window as any).solana.disconnect();
      }
      setWalletPubkey(null);
      setProvider(null);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if ((window as any).solana?.isConnected) {
      connectWallet();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        walletPubkey={walletPubkey} 
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
      />
      
      <main className="container mx-auto py-8 px-4">
        {!walletPubkey ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <Dumbbell className="h-16 w-16 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">Welcome to Solain 👋</h2>
                  <p className="text-muted-foreground">
                    Connect your wallet to start tracking your workouts on-chain
                  </p>
                </div>
                <Button onClick={connectWallet} size="lg" className="mt-4">
                  Connect Phantom Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="order-2 lg:order-1">
              <WorkoutList
                provider={provider}
                idl={idlJson as anchor.Idl}
                programId={PROGRAM_ID}
                walletPubkey={walletPubkey}
              />
            </div>

            <div className="order-1 lg:order-2">
              <InitializeWorkoutForm
                provider={provider}
                idl={idlJson as anchor.Idl}
                programId={PROGRAM_ID}
                walletPubkey={walletPubkey}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
