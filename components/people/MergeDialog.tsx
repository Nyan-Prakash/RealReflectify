"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Person = {
  id: string;
  canonicalName: string;
};

type MergeDialogProps = {
  sourcePerson: Person;
  availablePeople: Person[];
  onClose: () => void;
};

export function MergeDialog({
  sourcePerson,
  availablePeople,
  onClose,
}: MergeDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleMerge = async () => {
    if (!selectedTargetId) {
      toast.error("Please select a person to merge into");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/people/${sourcePerson.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selectedTargetId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || "People merged successfully!");
        router.push("/people");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to merge people");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Merge error:", error);
      toast.error("Network error while merging people");
      setIsSubmitting(false);
    }
  };

  const targetPerson = availablePeople.find((p) => p.id === selectedTargetId);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg text-text-primary mb-4">
          merge person
        </h2>

        <p className="text-sm text-text-secondary mb-4">
          merge <span className="text-text-primary">{sourcePerson.canonicalName}</span>{" "}
          into another person. all mentions will be transferred.
        </p>

        {/* Target Selection */}
        <div className="mb-6">
          <label
            htmlFor="target-person"
            className="block text-xs font-mono text-text-tertiary mb-2"
          >
            merge into:
          </label>
          <select
            id="target-person"
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="block w-full px-3 py-2 bg-bg-tertiary text-text-primary border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            <option value="">-- select a person --</option>
            {availablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.canonicalName}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {targetPerson && (
          <div className="bg-warning/10 rounded-lg p-3 mb-6">
            <p className="text-sm text-warning">
              <span className="text-text-primary">{sourcePerson.canonicalName}</span> will be merged
              into <span className="text-text-primary">{targetPerson.canonicalName}</span>.
              this action cannot be undone.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-text-secondary bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!selectedTargetId || isSubmitting}
            className="px-4 py-2 text-sm text-bg-primary bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "merging..." : "merge people"}
          </button>
        </div>
      </div>
    </div>
  );
}
