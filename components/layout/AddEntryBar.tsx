import AddEntryButton from "@/components/entry-form/AddEntryButton";
import AddWellnessButton from "@/components/wellness/AddWellnessButton";
import AddActionLogButton from "@/components/action-log/AddActionLogButton";

export default function AddEntryBar() {
  return (
    <div className="flex">
      <AddEntryButton variant="bar" />
      <AddWellnessButton />
      <AddActionLogButton />
    </div>
  );
}
