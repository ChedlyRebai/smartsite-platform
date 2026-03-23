import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateTaskPayload,
  KANBAN_BOARD_CIRCLE_COLORS_MAP,
  UpdateTaskPayload,
} from "@/app/types";
import { createTask, updateTask } from "@/app/action/planing.action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTaskStage,
  getAllTaskStages,
} from "@/app/action/taskStage.action";
import useTaskStageModal from "@/app/hooks/use-task-stage-modal";

const formSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(3, "Task name must be at least 3 characters.")
    .max(120, "Task name must be at most 120 characters."),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters.")
    .optional(),
  order: z.coerce.number().default(0),
  color: z.string(),
});

const TaskStageForm = ({ type }: { type: "edit" | "add" }) => {
  const queryClient = useQueryClient();
  const {
    id: taskId,
    onClose,
    onTaskChange,
    milestoneId,
  } = useTaskStageModal();

  console.log("milestone from task form", milestoneId);

  console.log("milestone id from TAskForm", milestoneId);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: "",
      description: "",
      color: "",
      order: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (task: CreateTaskPayload | UpdateTaskPayload) => {
      if (type === "add") {
        return createTask(task, milestoneId, task.status as string);
      }
      if (type === "edit" && taskId) {
        return updateTask(taskId as string, task);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getTaskSTagesByMilestoneId", milestoneId],
      });
      toast.success("Task created successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to create task , please try again");
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const reponse = await createTaskStage(data, milestoneId as string);
    if (reponse.status === 201 || reponse.status === 200) {
      toast.success("Task stage created successfully");
      onClose();
      queryClient.invalidateQueries({
        queryKey: ["getTaskSTagesByMilestoneId", milestoneId],
      });
    } else {
      toast.error("Failed to create task stage");
    }
  };

  return (
    <>
      <form id="form-rhf-TaskStageForm" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskStageForm-name">
                  Task Title
                </FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-TaskStageForm-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter task name"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskStageForm-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="form-rhf-TaskStageForm-description"
                    placeholder="Enter task description"
                    rows={6}
                    className="min-h-24 resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="tabular-nums">
                      {(field.value ?? "").length}/500 characters
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="color"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskForms-color">
                  Color
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className="w-full"
                    id="form-rhf-TaskForms-color"
                  >
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KANBAN_BOARD_CIRCLE_COLORS_MAP).map(
                      ([colorName, value]) => (
                        <SelectItem key={colorName} value={colorName}>
                          {colorName}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="order"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskStageForm-order">
                  order
                </FieldLabel>
                <Input
                  type="number"
                  {...field}
                  value={field.value as number}
                  id="form-rhf-TaskStageForm-"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Color"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <Field className="justify-end" orientation="horizontal">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="form-rhf-TaskStageForm">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default TaskStageForm;
