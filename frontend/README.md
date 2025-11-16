# Solain Workout Tracker

**Deployed Frontend URL:** -

**Solana Program ID:** `2BqFVR96CLqZ6AHue5FbUCXFk4zdiASaoL97wND53BT3`

## Project Overview

### Description
Solain is a decentralized fitness tracking application built on Solana blockchain. Users can create, manage, and track their workout routines entirely on-chain. Each workout is stored as a PDA (Program Derived Address) unique to the user's wallet, ensuring complete ownership and data persistence. The dApp demonstrates advanced Solana concepts including multi-account PDAs, program configuration state, and CRUD operations with authorization checks.

### Key Features
- **Create Workouts**: Initialize personalized workout routines with detailed metrics (reps, sets, duration, calories, difficulty)
- **Update Workouts**: Modify existing workout parameters while maintaining on-chain history
- **Delete Workouts**: Remove workouts with proper authorization validation
- **View Workout List**: Display all personal workouts with real-time blockchain data
- **Global Configuration**: Centralized program state tracking total workouts and sequential IDs
- **Category System**: Organize workouts by type (push, pull, legs, cardio, etc.)

### How to Use the dApp
1. **Connect Wallet** - Connect your Phantom wallet to Solana Devnet
2. **Initialize Program** - Program automatically initializes configuration on first workout creation
3. **Create Workout** - Fill in workout details (name, reps, sets, duration, calories, difficulty, category)
4. **View Workouts** - See all your workouts listed on the left panel with stats
5. **Edit Workout** - Click "Edit" button to modify workout parameters
6. **Delete Workout** - Remove unwanted workouts with confirmation dialog
7. **Track Progress** - Monitor calories burned, difficulty levels, and workout volume

## Program Architecture
The Solain program uses a sophisticated architecture with two main account types and four core instructions. The program leverages PDAs for both global configuration and individual workout accounts, ensuring scalability and user data isolation.

### PDA Usage
The program uses Program Derived Addresses to create deterministic accounts for configuration and user workouts.

**PDAs Used:**
- **Config PDA**: Derived from seeds `["config"]` - global program state tracking workout IDs and admin
- **Workout PDA**: Derived from seeds `["workout", user_wallet_pubkey, workout_id_bytes]` - unique workout account per user

### Program Instructions
**Instructions Implemented:**
- **Initialize**: Creates global program configuration with admin authority (runs once)
- **Initialize Workout**: Creates a new workout account with full workout details and auto-increments global ID
- **Update Workout**: Modifies existing workout fields with optional parameters (only owner can update)
- **Delete Workout**: Removes workout account and decrements total workout count (only owner can delete)
