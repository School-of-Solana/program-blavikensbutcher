import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface WorkoutListProps {
  provider: anchor.AnchorProvider | null;
  idl: anchor.Idl | null;
  programId: string;
  walletPubkey: PublicKey | null;
}

export interface WorkoutFormState {
  name: string;
  reps: number;
  sets: number;
  duration_sec: number;
  calories: number;
  difficulty: number;
  category: string;
}

export interface ProgramConfig {
  admin: PublicKey;
  next_workout_id: bigint; // u64
  total_workouts: bigint; // u64
  paused: boolean;
  bump: number; // u8
}

export interface Workout {
  workout_id: bigint;
  workout_author: PublicKey;
  name: string;
  reps: number;       // u16
  sets: number;       // u8
  duration_sec: number; // u32
  calories: number;   // u16
  difficulty: number; // u8
  category: string;
  bump: number;
}


export interface WorkoutAccountResult {
  publicKey: PublicKey;
  account: Workout;
}
