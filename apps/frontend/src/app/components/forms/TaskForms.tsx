import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateTaskPayload,
  Task,
  TaskStatusEnum,
  UpdateTaskPayload,
  User,
} from "@/app/types";
import useTaskModal from "@/app/hooks/use-task-modal";
import {
  createTask,
  getTaskById,
  updateTask,
} from "@/app/action/planing.action";
import { getAllUsers } from "@/app/action/user.action";
import { data, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTaskStages } from "@/app/action/taskStage.action";

const todayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const toMidnight = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const formSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .min(3, "Task title must be at least 3 characters.")
      .max(120, "Task title must be at most 120 characters."),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters.")
      .optional(),
    status: z.nativeEnum(TaskStatusEnum),
    assignedUsers: z.array(z.string()).optional(),
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine((data, ctx) => {
    const today = todayAtMidnight();
    if (data.startDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past.",
        path: ["startDate"],
      });
    }

    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after or equal to start date.",
        path: ["endDate"],
      });
    }
  });

const TaskForms = ({ type }: { type: "edit" | "add" }) => {
  const queryClient = useQueryClient();
  // const milestoneId = "69bc78a30912805125e58f72";

  const { id: taskId, onClose, onTaskChange, milestoneId } = useTaskModal();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  console.log("milestone from task form", milestoneId);
  const [openStartDate, setOpenStartDate] = React.useState(false);
  const [openEndDate, setOpenEndDate] = React.useState(false);
  console.log("milestone id from TAskForm", milestoneId);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      title: "",
      description: "",
      status: TaskStatusEnum.BACKLOG,
      assignedUsers: [],
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const mutation = useMutation({
    mutationFn: (task: CreateTaskPayload | UpdateTaskPayload) => {
      if (type === "add") {
        return createTask(task, milestoneId, "69c0561d9fc8a9ce45f45bee");
      }

      if (type === "edit" && taskId) {
        return updateTask(taskId as string, task);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestoneTasksData", milestoneId],
      });
      toast.success("Task created successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to create task , please try again");
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) =>
    mutation.mutate(data);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response?.status === 200 && Array.isArray(response.data)) {
        setAvailableUsers(response.data);
      }
    } catch {
      toast.error("Failed to load users.");
    }
  };

  const loadTaskData = async () => {
    if (type !== "edit" || !taskId) {
      return;
    }

    try {
      const res = await getTaskById(String(taskId));
      if (res.status === 200) {
        form.reset({
          id: res.data._id,
          title: res.data.title ?? "",
          description: res.data.description ?? "",
          status: res.data.status ?? TaskStatusEnum.BACKLOG,
          assignedUsers: Array.isArray(res.data.assignedUsers)
            ? res.data.assignedUsers
            : [],
          startDate: res.data.startDate
            ? new Date(res.data.startDate)
            : new Date(),
          endDate: res.data.endDate ? new Date(res.data.endDate) : new Date(),
        });
      }
    } catch {
      toast.error("Failed to load task data. Please try again.");
    }
  };

  useEffect(() => {
    loadUsers();
    loadTaskData();
  }, [type, taskId]);

  const { data: taskStages } = useQuery({
    queryKey: ["getAllTaskStages"],
    queryFn: () => getAllTaskStages(),
  });
  // const onSubmi = async (data: z.infer<typeof formSchema>) => {
  //   if (type === "add" && !milestoneId) {
  //     toast.error("Milestone id is missing in route.");
  //     return;
  //   }
  //   console.log("Form data to submit:", data);

  //   try {
  //     if (type === "add") {
  //       console.log("Creating task with data:", data);
  //       const res = await createTask({
  //         title: data.title,
  //         description: data.description,
  //         milestoneId: milestoneId as string,
  //         status: data.status,
  //         assignedUsers: data.assignedUsers,
  //         startDate: data.startDate,
  //         endDate: data.endDate,
  //       });

  //       if (res.status === 201 || res.status === 200) {
  //         toast.success("Task created successfully");
  //         form.reset({
  //           id: undefined,
  //           title: "",
  //           description: "",
  //           status: TaskStatusEnum.BACKLOG,
  //           assignedUsers: [],
  //           startDate: new Date(),
  //           endDate: new Date(),
  //         });
  //         onClose();
  //         onTaskChange();
  //       } else {
  //         toast.error("Failed to create task");
  //       }
  //     } else {
  //       if (!data.id) {
  //         toast.error("Task id is missing.");
  //         return;
  //       }

  //       const res = await updateTask(data.id, {
  //         title: data.title,
  //         description: data.description,
  //         status: data.status,
  //         assignedUsers: data.assignedUsers,
  //         startDate: data.startDate,
  //         endDate: data.endDate,
  //       });

  //       if (res.status === 200) {
  //         toast.success("Task updated successfully");
  //         onClose();
  //         onTaskChange();
  //       } else {
  //         toast.error("Failed to update task");
  //       }
  //     }
  //   } catch {
  //     toast.error("Failed to save task. Please try again.");
  //   }
  // };

  return (
    <>
      <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-title">
                  Task Title
                </FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-demo-title"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter task title"
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
                <FieldLabel htmlFor="form-rhf-demo-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="form-rhf-demo-description"
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
            name="assignedUsers"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Assigned Users</FieldLabel>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No users available.
                    </p>
                  ) : (
                    availableUsers.map((user) => {
                      const userId = user._id;
                      const label =
                        user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || user.nom || user.prenom || userId;
                      const isChecked = (field.value ?? []).includes(userId);

                      return (
                        <div className="flex items-center gap-2" key={userId}>
                          <Checkbox
                            checked={isChecked}
                            id={`task-user-${userId}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value ?? []),
                                  userId,
                                ]);
                                return;
                              }

                              field.onChange(
                                (field.value ?? []).filter(
                                  (id) => id !== userId,
                                ),
                              );
                            }}
                          />
                          <label
                            className="cursor-pointer text-sm"
                            htmlFor={`task-user-${userId}`}
                          >
                            {label}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </Field>
            )}
          />

          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-status">Status</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full" id="form-rhf-demo-status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* {Object.values(TaskStatusEnum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))} */}

                    {taskStages &&
                      taskStages.length > 0 &&
                      taskStages.map((taskStage) => (
                        <SelectItem key={taskStage._id} value={taskStage._id}>
                          {taskStage.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-start-date">Start date</FieldLabel>
                <Popover
                  open={openStartDate}
                  onOpenChange={setOpenStartDate}
                  modal={false}
                >
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline">
                      {field.value?.toLocaleDateString() || "Select date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0 z-50 pointer-events-auto">
                    <Calendar
                      disabled={(date) => date < todayAtMidnight()}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (!date) return;
                        field.onChange(date);
                        setOpenStartDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-end-date">End date</FieldLabel>

                {/* <Popover
                  modal={false}
                  open={openEndDate}
                  onOpenChange={setOpenEndDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      id="task-end-date"
                      className="justify-start font-normal"
                    >
                      {field.value
                        ? field.value.toLocaleDateString()
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      initialFocus
                      mode="single"
                      selected={field.value}
                      defaultMonth={field.value}
                      captionLayout="dropdown"
                      disabled={(date) =>
                        toMidnight(date) < toMidnight(form.watch("startDate"))
                      }
                      onSelect={(selectedDate) => {
                        if (!selectedDate) return;
                        field.onChange(selectedDate);
                        setOpenEndDate(false);
                      }}
                    />
                  </PopoverContent>
                </Popover> */}

                <Popover
                  open={openEndDate}
                  onOpenChange={setOpenEndDate}
                  modal={false}
                >
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="ml-auto">
                      {field.value?.toLocaleDateString() || "Select date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0 z-50 pointer-events-auto">
                    <Calendar
                      disabled={(date) => date < form.watch("startDate")}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (!date) return;
                        field.onChange(date);
                        setOpenEndDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
        <Button type="submit" form="form-rhf-demo">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default TaskForms;
