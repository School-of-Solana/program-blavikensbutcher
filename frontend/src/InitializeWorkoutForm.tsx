import React, { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { initializeWorkoutInstruction } from "@/lib/workoutInstructions";


if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

export default function InitializeWorkoutForm(props: {
  provider: anchor.AnchorProvider | null;
  idl: any | null;
  programId: string;
  walletPubkey: PublicKey | null;
}) {
  const { provider, idl, walletPubkey } = props;
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callInitializeWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !walletPubkey) {
      alert("Connect wallet first");
      return;
    }

    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as any).value || "My workout";
    const reps = Number((form.elements.namedItem("reps") as any).value || 0);
    const sets = Number((form.elements.namedItem("sets") as any).value || 0);
    const duration_sec = Number(
      (form.elements.namedItem("duration_sec") as any).value || 0
    );
    const calories = Number((form.elements.namedItem("calories") as any).value || 0);
    const difficulty = Number(
      (form.elements.namedItem("difficulty") as any).value || 1
    );
    const category = (form.elements.namedItem("category") as any).value || "general";

    try {
      if (!idl) {
        alert("IDL not loaded");
        setIsLoading(false);
        return;
      }

      const program = new anchor.Program(idl, provider);
      setStatus("Submitting workout...");

      const result = await initializeWorkoutInstruction({
        program,
        walletPubkey,
        form: {
          name,
          reps,
          sets,
          duration_sec,
          calories,
          difficulty,
          category,
        },
      });

      setStatus(
        `✅ Workout #${result.workoutId.toString()} created! Tx: ${result.txSignature.substring(
          0,
          8
        )}...`
      );
      form.reset();
    } catch (err: any) {
      console.error("Full error:", err);
      setStatus("Error: " + (err?.message || err?.toString?.()));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Workout 💪</CardTitle>
        <CardDescription>
          Add a new workout to your training program on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={callInitializeWorkout} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue="Push-ups"
              placeholder="e.g., Push-ups"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                name="reps"
                type="number"
                defaultValue={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                name="sets"
                type="number"
                defaultValue={3}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_sec">Duration (seconds)</Label>
              <Input
                id="duration_sec"
                name="duration_sec"
                type="number"
                defaultValue={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                name="calories"
                type="number"
                defaultValue={100}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (1-10)</Label>
              <Input
                id="difficulty"
                name="difficulty"
                type="number"
                min={1}
                max={10}
                defaultValue={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue="push"
                placeholder="e.g., push, pull, legs"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create Workout"}
          </Button>
        </form>

        {status && (
          <Alert className="mt-4" variant={status.startsWith("✅") ? "default" : "destructive"}>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
