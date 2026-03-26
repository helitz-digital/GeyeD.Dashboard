"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import type { StepRequest } from "@/lib/api/types";

interface StepListProps {
  steps: StepRequest[];
  activeStepIndex: number;
  isDraft: boolean;
  onSelectStep: (index: number) => void;
  onAddStep: () => void;
  onReorder: (steps: StepRequest[]) => void;
}

function SortableStepItem({
  step,
  index,
  isActive,
  isDraft,
  onSelect,
}: {
  step: StepRequest;
  index: number;
  isActive: boolean;
  isDraft: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg px-4 py-3.5 text-left transition-colors ${
        isActive
          ? "border border-primary/20 bg-secondary"
          : "hover:bg-muted"
      }`}
      {...attributes}
    >
      {isDraft && (
        <span
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
          {...listeners}
        >
          <GripVertical className="size-4" />
        </span>
      )}
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {step.title || "Untitled Step"}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {step.targetSelector || "No selector"}
        </p>
      </div>
    </button>
  );
}

export function StepList({
  steps,
  activeStepIndex,
  isDraft,
  onSelectStep,
  onAddStep,
  onReorder,
}: StepListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      const reordered = arrayMove(steps, oldIndex, newIndex);
      onReorder(reordered);
    }
  }

  const items = steps.map((_, i) => i.toString());

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {steps.map((step, index) => (
              <SortableStepItem
                key={index}
                step={step}
                index={index}
                isActive={activeStepIndex === index}
                isDraft={isDraft}
                onSelect={() => onSelectStep(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isDraft && (
        <button
          type="button"
          onClick={onAddStep}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add Step
        </button>
      )}

      {steps.length === 0 && !isDraft && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No steps in this version.
          </p>
        </div>
      )}
    </>
  );
}
