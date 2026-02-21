import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field";
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
import { createRole, getAllRoles } from "@/app/action/role.action";
import { createUser } from "@/app/action/user.action";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
  SelectSeparator,
} from "../ui/select";
import { SelectLabel } from "../ui/select";
import { Role } from "@/app/types";

const formSchema = z
  .object({
    cin: z.string().min(8, "CIN must be at least 8 characters."),
    firstname: z
      .string()
      .min(5, "Firstname must be at least 5 characters.")
      .max(32, "Firstname must be at most 32 characters."),
    lastname: z
      .string()
      .min(5, "Lastname must be at least 5 characters.")
      .max(32, "Lastname must be at most 32 characters."),
    email: z.string().email("Invalid email address"),
    telephone: z.string(),
    password: z
      .string()
      .max(32, "Password must be at most 32 characters.")
      .min(8, "password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .max(32, "Password must be at most 32 characters.")
      .min(8, "password must be at least 8 characters"),

    address: z.string().optional(),
    role: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
const UserForms = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      firstname: "",
      lastname: "",
      email: "",
      telephone: "",
      password: "",
      address: "",
      confirmPassword: "",
      role: "",
    },
  });
  

  useEffect(()=>{
    loadRoles();
  },[])
  const [roles, setRoles] = useState<Role[]>([]);
  const loadRoles = async () => {
    try {
      const response = await getAllRoles();
      if (response.status === 200) {
        setRoles(response.data);
      }
    } catch (error) {
      console.log("FAiled to loading roles");
    }
  };
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // try {
    //   const res = await createUser(data.firstname, data.lastname, data.email, data.telephone, data.password, data.address);
    //   if (res.status === 201) {
    //     toast.success("User created successfully");
    //   }
    // } catch (error: any) {
    //   toast.error("Failed to create user. Please try again.");
    // }
    console.log(
      data.address,
      data.email,
      data.firstname,
      data.lastname,
      data.telephone,
      data,
    );
    try {
      const response = await createUser(data);
      if (response.status === 201) {
        toast.success("User created successfully");
      }
    } catch (error) {
      toast.error("Failed to create user. Please try again.");
    }
  };
  return (
    <>
      <form
        className=""
        id="form-rhf-demo"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex justify-between gap-x-3">
            <Controller
              name="firstname"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-firstname">
                    Firstname
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-firstname"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter firstname"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="lastname"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-lastname">
                    Lastname
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-lastname"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter Lastname"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-demo-email"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter email"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex justify-between gap-x-3">
            <Controller
              name="cin"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-cin">CIN</FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-cin"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter cin"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="telephone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-telephone">
                    Telephone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-telephone"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter telephone"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-address">Address</FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-demo-address"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter address"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-password">Role</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="form-rhf-select-language"
                    aria-invalid={fieldState.invalid}
                    className="min-w-[120px]"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {roles.map((language) => (
                      <SelectItem key={language._id} value={language._id}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-password">
                  Password
                </FieldLabel>
                <Input
                  type="password"
                  {...field}
                  id="form-rhf-demo-password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter password"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-confirm">
                  Confirm Password
                </FieldLabel>
                <Input
                  type="password"
                  {...field}
                  id="form-rhf-demo-confirm"
                  aria-invalid={fieldState.invalid}
                  placeholder="Confirm password"
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
        <Button type="submit" form="form-rhf-demo">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default UserForms;
