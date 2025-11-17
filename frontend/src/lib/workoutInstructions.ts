import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";

const WORKOUT_NAME_LENGTH = 16;
const WORKOUT_CATEGORY_LENGTH = 10;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

const CONFIG_SEED = "config";
const WORKOUT_SEED = "workout";

type NumberLike = number | bigint | anchor.BN;

export interface InitializeWorkoutPayload {
  name: string;
  reps: number;
  sets: number;
  duration_sec: number;
  calories: number;
  difficulty: number;
  category: string;
}

export type UpdateWorkoutPayload = Partial<InitializeWorkoutPayload>;

export interface InitializeWorkoutInstructionParams {
  program: anchor.Program;
  walletPubkey: PublicKey;
  form: InitializeWorkoutPayload;
}

export interface UpdateWorkoutInstructionParams {
  program: anchor.Program;
  walletPubkey: PublicKey;
  workoutPublicKey: PublicKey;
  workoutId: NumberLike;
  form: UpdateWorkoutPayload;
}

export interface DeleteWorkoutInstructionParams {
  program: anchor.Program;
  walletPubkey: PublicKey;
  workoutPublicKey: PublicKey;
  workoutId: NumberLike;
}

export interface InitializeWorkoutResult {
  workoutId: number;
  workoutPda: PublicKey;
  configPda: PublicKey;
  txSignature: string;
}

export interface UpdateWorkoutResult {
  txSignature: string;
}

export interface DeleteWorkoutResult {
  txSignature: string;
  configPda: PublicKey;
}

export async function initializeWorkoutInstruction({
  program,
  walletPubkey,
  form,
}: InitializeWorkoutInstructionParams): Promise<InitializeWorkoutResult> {
  validateWorkoutForm(form);

  const configPda = getConfigPda(program.programId);
  const configAccount = await ensureConfigInitialized(program, walletPubkey, configPda);
  const nextWorkoutId = normalizeNumber(configAccount.nextWorkoutId);
  const workoutIdBn = numberLikeToBn(nextWorkoutId);
  const workoutPda = getWorkoutPda(program.programId, walletPubkey, workoutIdBn);

  const txSignature = await program.methods
    .initializeWorkout(
      workoutIdBn,
      form.name,
      form.reps,
      form.sets,
      form.duration_sec,
      form.calories,
      form.difficulty,
      form.category
    )
    .accounts({
      config: configPda,
      workoutAuthority: walletPubkey,
      workout: workoutPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    workoutId: nextWorkoutId,
    workoutPda,
    configPda,
    txSignature,
  };
}

export async function updateWorkoutInstruction({
  program,
  walletPubkey,
  workoutPublicKey,
  workoutId,
  form,
}: UpdateWorkoutInstructionParams): Promise<UpdateWorkoutResult> {
  validatePartialWorkoutForm(form);
  const workoutIdBn = numberLikeToBn(workoutId);

  const txSignature = await program.methods
    .updateWorkout(
      workoutIdBn,
      nullable(form.name),
      nullable(form.reps),
      nullable(form.sets),
      nullable(form.duration_sec),
      nullable(form.calories),
      nullable(form.difficulty),
      nullable(form.category)
    )
    .accounts({
      workoutAuthor: walletPubkey,
      workout: workoutPublicKey,
    })
    .rpc();

  return { txSignature };
}

export async function deleteWorkoutInstruction({
  program,
  walletPubkey,
  workoutPublicKey,
  workoutId,
}: DeleteWorkoutInstructionParams): Promise<DeleteWorkoutResult> {
  const workoutIdBn = numberLikeToBn(workoutId);
  const configPda = getConfigPda(program.programId);

  const txSignature = await program.methods
    .deleteWorkout(workoutIdBn)
    .accounts({
      config: configPda,
      workoutAuthor: walletPubkey,
      workout: workoutPublicKey,
    })
    .rpc();

  return { txSignature, configPda };
}

function validateWorkoutForm(form: InitializeWorkoutPayload) {
  if (form.name.length > WORKOUT_NAME_LENGTH) {
    throw new Error(`Workout name exceeds ${WORKOUT_NAME_LENGTH} characters`);
  }

  if (form.category.length > WORKOUT_CATEGORY_LENGTH) {
    throw new Error(`Workout category exceeds ${WORKOUT_CATEGORY_LENGTH} characters`);
  }

  if (form.difficulty < MIN_DIFFICULTY || form.difficulty > MAX_DIFFICULTY) {
    throw new Error(`Difficulty must be between ${MIN_DIFFICULTY} and ${MAX_DIFFICULTY}`);
  }
}

function validatePartialWorkoutForm(form: UpdateWorkoutPayload) {
  if (form.name !== undefined && form.name.length > WORKOUT_NAME_LENGTH) {
    throw new Error(`Workout name exceeds ${WORKOUT_NAME_LENGTH} characters`);
  }
  if (form.category !== undefined && form.category.length > WORKOUT_CATEGORY_LENGTH) {
    throw new Error(`Workout category exceeds ${WORKOUT_CATEGORY_LENGTH} characters`);
  }
  if (
    form.difficulty !== undefined &&
    (form.difficulty < MIN_DIFFICULTY || form.difficulty > MAX_DIFFICULTY)
  ) {
    throw new Error(`Difficulty must be between ${MIN_DIFFICULTY} and ${MAX_DIFFICULTY}`);
  }
}

async function ensureConfigInitialized(
  program: anchor.Program,
  walletPubkey: PublicKey,
  configPda: PublicKey
) {
  try {
    return await program.account.programConfig.fetch(configPda);
  } catch (error) {
    await program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: walletPubkey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return await program.account.programConfig.fetch(configPda);
  }
}

function getConfigPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from(CONFIG_SEED)], programId)[0];
}

function getWorkoutPda(programId: PublicKey, walletPubkey: PublicKey, workoutIdBn: anchor.BN) {
  const workoutSeed = Buffer.from(WORKOUT_SEED);
  const workoutIdBuffer = workoutIdBn.toArrayLike(Buffer, "le", 8);
  return PublicKey.findProgramAddressSync(
    [workoutSeed, walletPubkey.toBuffer(), workoutIdBuffer],
    programId
  )[0];
}

function numberLikeToBn(value: NumberLike) {
  if (anchor.BN.isBN(value)) {
    return value as anchor.BN;
  }
  if (typeof value === "bigint") {
    return new anchor.BN(value.toString());
  }
  return new anchor.BN(value);
}

function normalizeNumber(value: NumberLike) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return (value as anchor.BN).toNumber();
}

function nullable<T>(value: T | undefined) {
  return value === undefined ? null : value;
}

