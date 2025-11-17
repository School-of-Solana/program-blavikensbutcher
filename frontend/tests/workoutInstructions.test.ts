import { describe, it, expect, vi } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  deleteWorkoutInstruction,
  initializeWorkoutInstruction,
  updateWorkoutInstruction,
} from "@/lib/workoutInstructions";

const PROGRAM_ID = new PublicKey(
  "2BqFVR96CLqZ6AHue5FbUCXFk4zdiASaoL97wND53BT3"
);
const WALLET = new PublicKey("9xQeWvG816bUx9EPdQnXyZ3mVzq7DxkqM4kG4R3fSkkh");

describe("workout instructions helpers", () => {
  it("initializes workout with derived PDAs (happy path)", async () => {
    const configAccount = { nextWorkoutId: new anchor.BN(4) };
    const { program, fetchMock, chains } = createProgramDouble({
      configFetchMock: vi.fn().mockResolvedValue(configAccount),
    });

    const result = await initializeWorkoutInstruction({
      program,
      walletPubkey: WALLET,
      form: {
        name: "Pushups",
        reps: 10,
        sets: 3,
        duration_sec: 60,
        calories: 100,
        difficulty: 5,
        category: "push",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(chains.initialize.method).not.toHaveBeenCalled();
    expect(chains.initializeWorkout.method).toHaveBeenCalledTimes(1);

    const workoutCallArgs = chains.initializeWorkout.method.mock.calls[0];
    expect(workoutCallArgs[0]).toBeInstanceOf(anchor.BN);
    expect(workoutCallArgs[0].toNumber()).toBe(4);

    const expectedConfig = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    )[0];
    const expectedWorkout = PublicKey.findProgramAddressSync(
      [
        Buffer.from("workout"),
        WALLET.toBuffer(),
        new anchor.BN(4).toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    )[0];

    expect(chains.initializeWorkout.accounts).toHaveBeenCalledWith({
      config: expectedConfig,
      workoutAuthority: WALLET,
      workout: expectedWorkout,
      systemProgram: SystemProgram.programId,
    });

    expect(result.workoutId).toBe(4);
    expect(result.txSignature).toBe("initializeWorkoutTx");
  });

  it("creates config on demand before initializing workout", async () => {
    const configAccount = { nextWorkoutId: new anchor.BN(1) };
    const configFetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Account does not exist"))
      .mockResolvedValueOnce(configAccount);
    const { program, chains } = createProgramDouble({ configFetchMock });

    await initializeWorkoutInstruction({
      program,
      walletPubkey: WALLET,
      form: {
        name: "Pullups",
        reps: 8,
        sets: 4,
        duration_sec: 90,
        calories: 120,
        difficulty: 6,
        category: "pull",
      },
    });

    const expectedConfig = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    )[0];

    expect(configFetchMock).toHaveBeenCalledTimes(2);
    expect(chains.initialize.method).toHaveBeenCalledTimes(1);
    expect(chains.initialize.accounts).toHaveBeenCalledWith({
      config: expectedConfig,
      authority: WALLET,
      systemProgram: SystemProgram.programId,
    });
    expect(chains.initialize.rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects initialize when client validation fails (difficulty out of range)", async () => {
    const { program } = createProgramDouble();
    await expect(
      initializeWorkoutInstruction({
        program,
        walletPubkey: WALLET,
        form: {
          name: "Pushups",
          reps: 10,
          sets: 3,
          duration_sec: 60,
          calories: 100,
          difficulty: 11,
          category: "push",
        },
      })
    ).rejects.toThrow("Difficulty must be between");
  });

  it("updates workout and forwards nullable fields", async () => {
    const { program, chains } = createProgramDouble();
    const workoutPk = new PublicKey(
      "Fg6PaFpoGXkYsidMpWFKrbpkBxeor5yi7bZk1k5K7WjW"
    );

    await updateWorkoutInstruction({
      program,
      walletPubkey: WALLET,
      workoutPublicKey: workoutPk,
      workoutId: 7,
      form: {
        name: "Situps",
        reps: 25,
        // omit sets to verify null forwarding
        duration_sec: 120,
      },
    });

    expect(chains.updateWorkout.method).toHaveBeenCalledTimes(1);
    const args = chains.updateWorkout.method.mock.calls[0];
    expect(args[0]).toBeInstanceOf(anchor.BN);
    expect(args[1]).toBe("Situps");
    expect(args[2]).toBe(25);
    expect(args[3]).toBeNull();
    expect(args[4]).toBe(120);
    expect(args[5]).toBeNull();
    expect(args[6]).toBeNull();
    expect(args[7]).toBeNull();

    expect(chains.updateWorkout.accounts).toHaveBeenCalledWith({
      workoutAuthor: WALLET,
      workout: workoutPk,
    });
  });

  it("rejects update when category exceeds limits", async () => {
    const { program } = createProgramDouble();
    await expect(
      updateWorkoutInstruction({
        program,
        walletPubkey: WALLET,
        workoutPublicKey: WALLET,
        workoutId: 1,
        form: { category: "super-long-category" },
      })
    ).rejects.toThrow("Workout category exceeds");
  });

  it("deletes workout with derived config PDA", async () => {
    const { program, chains } = createProgramDouble();
    const workoutPk = new PublicKey(
      "BPFLoader1111111111111111111111111111111111"
    );

    await deleteWorkoutInstruction({
      program,
      walletPubkey: WALLET,
      workoutPublicKey: workoutPk,
      workoutId: 2,
    });

    expect(chains.deleteWorkout.method).toHaveBeenCalledTimes(1);

    const expectedConfig = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    )[0];
    expect(chains.deleteWorkout.accounts).toHaveBeenCalledWith({
      config: expectedConfig,
      workoutAuthor: WALLET,
      workout: workoutPk,
    });
  });

  it("bubbles RPC errors during delete", async () => {
    const { program, chains } = createProgramDouble();
    const deleteError = new Error("Unauthorized");
    chains.deleteWorkout.rpc.mockRejectedValueOnce(deleteError);

    await expect(
      deleteWorkoutInstruction({
        program,
        walletPubkey: WALLET,
        workoutPublicKey: WALLET,
        workoutId: 3,
      })
    ).rejects.toThrow("Unauthorized");
  });
});

type ProgramDoubleOverrides = {
  configFetchMock?: ReturnType<typeof vi.fn>;
};

function createProgramDouble(overrides: ProgramDoubleOverrides = {}) {
  const initialize = createMethodChain("initializeConfigTx");
  const initializeWorkout = createMethodChain("initializeWorkoutTx");
  const updateWorkout = createMethodChain("updateWorkoutTx");
  const deleteWorkout = createMethodChain("deleteWorkoutTx");

  const configFetchMock =
    overrides.configFetchMock ??
    vi.fn().mockResolvedValue({
      nextWorkoutId: new anchor.BN(0),
    });

  const program = {
    programId: PROGRAM_ID,
    account: {
      programConfig: { fetch: configFetchMock },
    },
    methods: {
      initialize: initialize.method,
      initializeWorkout: initializeWorkout.method,
      updateWorkout: updateWorkout.method,
      deleteWorkout: deleteWorkout.method,
    },
  } as unknown as anchor.Program;

  return {
    program,
    fetchMock: configFetchMock,
    chains: {
      initialize,
      initializeWorkout,
      updateWorkout,
      deleteWorkout,
    },
  };
}

function createMethodChain(defaultTx: string) {
  const rpc = vi.fn().mockResolvedValue(defaultTx);
  const accounts = vi.fn().mockReturnValue({ rpc });
  const method = vi.fn().mockReturnValue({ accounts });
  return { method, accounts, rpc };
}
