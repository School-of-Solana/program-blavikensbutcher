import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkoutFormState } from "@/types/workout.types";


interface EditWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WorkoutFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export function EditWorkoutDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  onCancel,
}: EditWorkoutDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-8">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
          <DialogDescription>Update the details of your workout.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={form.name} onChange={onChange} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input type="number" id="reps" name="reps" value={form.reps} onChange={onChange} required min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input type="number" id="sets" name="sets" value={form.sets} onChange={onChange} required min={0} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration_sec">Duration (sec)</Label>
              <Input type="number" id="duration_sec" name="duration_sec" value={form.duration_sec} onChange={onChange} required min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input type="number" id="calories" name="calories" value={form.calories} onChange={onChange} required min={0} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (1-10)</Label>
              <Input type="number" id="difficulty" name="difficulty" value={form.difficulty} onChange={onChange} min={1} max={10} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={form.category} onChange={onChange} required />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
