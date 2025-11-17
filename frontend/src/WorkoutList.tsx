import { useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Clock,
  Flame,
  TrendingUp,
  Trash2,
  Edit2,
} from "lucide-react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EditWorkoutDialog } from "./components/EditWorkoutDialog";
import {
  WorkoutListProps,
  WorkoutFormState,
  WorkoutAccountResult,
} from "./types/workout.types";
import {
  updateWorkoutInstruction,
  deleteWorkoutInstruction,
} from "@/lib/workoutInstructions";

export default function WorkoutList({
  provider,
  idl,
  walletPubkey,
}: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<WorkoutAccountResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWorkout, setEditingWorkout] =
    useState<WorkoutAccountResult | null>(null);
  const [form, setForm] = useState<WorkoutFormState>({
    name: "",
    reps: 0,
    sets: 0,
    duration_sec: 0,
    calories: 0,
    difficulty: 1,
    category: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] =
    useState<WorkoutAccountResult | null>(null);


  const fetchWorkouts = async () => {
    if (!provider || !idl || !walletPubkey) return;

    setLoading(true);
    try {
    const program = new anchor.Program(idl, provider);

      const allWorkouts = await program.account.workout.all();
      setWorkouts(
        allWorkouts.filter(
          (w) => w.account.workoutAuthor.toString() === walletPubkey.toString()
        )
      );
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [provider, walletPubkey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "name" || name === "category" ? value : Number(value),
    }));
  };

  const openEditDialog = (workout: any) => {
    setEditingWorkout(workout);
    setForm({
      name: workout.account.name,
      reps: workout.account.reps,
      sets: workout.account.sets,
      duration_sec: workout.account.durationSec,
      calories: workout.account.calories,
      difficulty: workout.account.difficulty,
      category: workout.account.category,
    });
  };

  const closeEditDialog = () => {
    setEditingWorkout(null);
  };

  const updateWorkout = async () => {
    if (!provider || !idl || !walletPubkey || !editingWorkout) return;
    try {
      const program = new anchor.Program(idl, provider);
      await updateWorkoutInstruction({
        program,
        walletPubkey,
        workoutPublicKey: editingWorkout.publicKey,
        workoutId: editingWorkout.account.workoutId,
        form,
      });
      closeEditDialog();
      fetchWorkouts();
    } catch (e) {
      alert("Failed to update workout: " + e);
    }
  };

  const deleteWorkout = async () => {
    if (!provider || !idl || !walletPubkey || !workoutToDelete) return;

    try {
      const program = new anchor.Program(idl, provider);
      await deleteWorkoutInstruction({
        program,
        walletPubkey,
        workoutPublicKey: workoutToDelete.publicKey,
        workoutId: workoutToDelete.account.workoutId,
      });
      setShowDeleteConfirm(false);
      setWorkoutToDelete(null);
      fetchWorkouts();
    } catch (e) {
      alert("Failed to delete workout: " + e);
    }
  };


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Workouts</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchWorkouts}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading workouts...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No workouts found</p>
            <p className="text-sm text-muted-foreground">
              Create your first workout!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout, idx) => (
              <Card
                key={idx}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{workout.account.name}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {workout.account.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      <span>
                        {workout.account.sets} × {workout.account.reps}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{workout.account.durationSec}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      <span>{workout.account.calories} cal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Lvl {workout.account.difficulty}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openEditDialog(workout)}
                    >
                      <Edit2 className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setWorkoutToDelete(workout);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditWorkoutDialog
          open={!!editingWorkout}
          onOpenChange={(open) => !open && closeEditDialog()}
          form={form}
          onChange={handleInputChange}
          onSave={updateWorkout}
          onCancel={closeEditDialog}
        />

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Confirm Deletion"
          description="This action cannot be undone."
          onConfirm={deleteWorkout}
          confirmText="Delete"
          cancelText="Cancel"
        >
          <p>
            Are you sure you want to delete the workout "
            {workoutToDelete?.account.name}"?
          </p>
        </ConfirmDialog>
      </CardContent>
    </Card>
  );
}
