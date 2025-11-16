import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

interface HeaderProps {
  walletPubkey: any | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export default function Header({
  walletPubkey,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold flex items-center gap-2">
            Solain Workout Tracker
            <Dumbbell className="w-6 h-6 text-primary" />
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {walletPubkey ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-mono">
                {walletPubkey.toString().slice(0, 4)}...
                {walletPubkey.toString().slice(-4)}
              </span>
              <Button variant="outline" size="sm" onClick={onDisconnectWallet}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={onConnectWallet}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
}
