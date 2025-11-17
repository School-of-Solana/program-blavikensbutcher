# Project Description

**Deployed Frontend URL:** https://solain-frontend.vercel.app/

**Solana Program ID:** `2BqFVR96CLqZ6AHue5FbUCXFk4zdiASaoL97wND53BT3`

## Project Overview

### Description

Solain is a decentralized fitness tracking dApp on Solana. Each workout a user creates is represented as a PDA owned by that user’s wallet, so routines cannot be tampered with or lost. The program exposes CRUD instructions for workouts plus a global configuration state, showcasing how to mix multiple PDA types, deterministic seeds, and authority checks in one cohesive product.

### Key Features

- **Create Workouts** – Initialize personalized routines with reps, sets, duration, calories, difficulty, and category metadata.
- **Update Workouts** – Patch existing workouts field-by-field while preserving untouched data.
- **Delete Workouts** – Remove workouts after an explicit confirmation flow that guards against accidental deletions.
- **Workout Dashboard** – Fetch and display the caller’s workouts with live data pulled from Solana accounts.
- **Auto Config Initialization** – First-time users trigger `initialize` implicitly, so there is no manual setup friction.
- **Category & Difficulty Insights** – Organize workouts by type and difficulty tiers for easier progress tracking.

### How to Use the dApp

1. **Connect Wallet** – Open the app on Devnet and connect Phantom (or another Solana wallet).
2. **Initialize Program** – The first workout creation automatically initializes the global config PDA.
3. **Create Workout** – Enter metrics (name, reps, sets, duration_sec, calories, difficulty, category) and submit.
4. **View Workouts** – The sidebar lists every workout PDA for the connected wallet with its stats.
5. **Edit Workout** – Select any entry, update the desired fields, and confirm the transaction.
6. **Delete Workout** – Use the delete action plus confirmation modal to close an account you no longer need.
7. **Track Progress** – Monitor calories burned, workload volume, and difficulty trends over time.

## Program Architecture

Solain uses two persistent account types (`ProgramConfig` and `Workout`) that are both PDA-derived. Instructions enforce signer/owner checks so only the original author can mutate their workouts, while the config account tracks total counts and the next incremental ID. Each instruction routes through dedicated handler modules for clarity.

### PDA Usage

**PDAs Used:**

- **Config PDA** – `["config"]` seed; stores admin, counters, paused flag, and bump. This PDA is unique per deployment and bootstrapped once.
- **Workout PDA** – `["workout", workout_author, workout_id_le_bytes]` seeds; unique per workout per user. This keeps data separated by wallet and deterministic for UI fetches.

### Program Instructions

- **Initialize** – Creates `ProgramConfig`, sets admin to the caller, initializes counters, and records the PDA bump.
- **Initialize Workout** – Derives the user’s next workout PDA, writes all supplied metrics, increments global counters, and requires the author signer.
- **Update Workout** – Applies partial updates. Any field omitted remains unchanged; enforces that only the workout author can call it.
- **Delete Workout** – Closes the workout PDA, returns rent to the author, and decrements the total workout count in the config account.

### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub next_workout_id: u64,
    pub total_workouts: u64,
    pub paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Workout {
    pub workout_id: u64,
    pub workout_author: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub reps: u16,
    pub sets: u8,
    pub duration_sec: u32,
    pub calories: u16,
    pub difficulty: u8,
    #[max_len(20)]
    pub category: String,
    pub bump: u8,
}
```

## Testing

### Test Coverage

Frontend Vitest suites mock Anchor clients to exercise every instruction helper (initialize, initializeWorkout, updateWorkout, deleteWorkout) across both success and failure paths. Anchor program tests currently cover the `initialize` flow and can be extended with the same scenarios used on the frontend.

**Happy Path Tests:**

- `initializes workout with derived PDAs` – ensures correct PDA seeds and argument marshalling for `initialize_workout`.
- `creates config on demand` – validates that the UI triggers `initialize` when the config PDA is missing.
- `updates workout and forwards nullable fields` – checks that optional fields convert to `null` for Anchor when omitted.
- `deletes workout with derived config PDA` – confirms account metas match what the on-chain handler expects.

**Unhappy Path Tests:**

- `difficulty out of range` – client-side guard rails reject invalid workout inputs before RPC.
- `category exceeds limits` – demonstrates partial update validation errors.
- `bubbles RPC errors during delete` – surfaces Anchor rejections (e.g., unauthorized signer) back to the UI.

### Running Tests

```bash
# Frontend helper/unit tests
cd frontend
npm test

# Anchor program tests
cd anchor_project/solain
anchor test
```

### Additional Notes for Evaluators

- The frontend uses the generated IDL plus `@coral-xyz/anchor` to derive instructions directly in the browser.
- Program-derived addressing guarantees every workout belongs to exactly one wallet, so the UI can deterministically fetch records without an indexer.
- Devnet deployment is continuously synced with the Vercel frontend; redeployments reuse the same program ID listed above.
