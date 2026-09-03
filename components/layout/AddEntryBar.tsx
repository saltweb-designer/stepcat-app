import AddEntryButton from "@/components/entry-form/AddEntryButton";
import AddWellnessButton from "@/components/wellness/AddWellnessButton";

export default function AddEntryBar() {
  return (
    <div className="flex">
      <AddEntryButton variant="bar" />
      <AddWellnessButton />
    </div>
  );
}
