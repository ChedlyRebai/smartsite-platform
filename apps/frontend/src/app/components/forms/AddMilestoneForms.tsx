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

import { useState } from "react";

import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Milestone } from "@/app/types";
import useMilestoneModal from "@/app/hooks/use-milestone-modal";
import axios from "axios";
import { createMilestone } from "@/app/action/milestone.action";
import { da } from "zod/v4/locales";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const todayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .min(3, "Milestone title must be at least 3 characters.")
      .max(120, "Milestone title must be at most 120 characters."),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters.")
      .optional(),
    //assignedUsers: z.array(z.string()).optional(),
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

type FormValues = z.infer<typeof formSchema>;

const AddMilestoneForms = ({ type }: { type: "edit" | "add" }) => {
  // const milestoneId = "69bc78a30912805125e58f72";

  const { id, onClose, onOpen, projectId } = useMilestoneModal();
  //const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  //console.log("milestone from milestone form",milestoneId);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  //const queryClient = useQueryClient();
  // useEffect(() => {}, [type, id]);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (milestone: Milestone) => createMilestone(milestone,projectId as string),
    onSuccess: () => {
      toast.success("Milestone created successfully!");
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["milestones", projectId!] });
      }
      onClose();
    },
    onError: (error: any) => {
      toast.error("Failed to create milestone");
      console.error(error);
    },
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  // const onSubmi = async (data: z.infer<typeof formSchema>) => {
  //   // console.log(data);
  //   // console.log("Project id from milestone form", projectId);
  //   if (type === "add") {
  //     try {
  //       console.log("Creating milestone with data:", projectId);
  //       const res = await createMilestone({
  //         title: data.title,
  //         description: data.description,
  //         projectId: projectId as string,
  //         startDate: data.startDate,
  //         endDate: data.endDate,
  //       });
  //       //console.log(res);
  //       if (res.status === 201 || res.status === 200) {
  //         toast.success("Milestone created successfully");
  //         onClose();
  //         form.reset();
  //       }
  //     } catch (error) {
  //       toast.error("Failed to create milestone");
  //     }
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
                  Milestone Title
                </FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-demo-title"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter milestone title"
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
                    placeholder="Enter milestone description"
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
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="milestone-start-date">
                  Start date
                </FieldLabel>
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
                <FieldLabel htmlFor="milestone-end-date">End date</FieldLabel>
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

export default AddMilestoneForms;
