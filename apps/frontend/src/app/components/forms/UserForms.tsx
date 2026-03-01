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
import { createUser, getUserById, updateUser } from "@/app/action/user.action";
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
import useAddUserModal from "@/app/hooks/use-user-Modal";

const UserForms = ({ type }: { type: "add" | "edit" }) => {
  let formSchema;
  if (type === "edit") {
    formSchema = z
      .object({
        cin: z.string().min(8, "CIN must be at least 8 characters.").optional(),
        firstName: z
          .string()
          .min(5, "firstName must be at least 5 characters.")
          .max(32, "firstName must be at most 32 characters.")
          .optional(),
        lastName: z
          .string()
          .min(5, "lastName must be at least 5 characters.")
          .max(32, "lastName must be at most 32 characters.")
          .optional(),
        email: z.string().email("Invalid email address").optional(),
        phoneNumber: z.string().optional(),
        password: z
          .string()
          .max(32, "Password must be at most 32 characters.")
          .min(8, "password must be at least 8 characters")
          .optional(),
        confirmPassword: z
          .string()
          .max(32, "Password must be at most 32 characters.")
          .min(8, "password must be at least 8 characters")
          .optional(),

        address: z.string().optional(),
        role: z.string().optional(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
  } else {
    formSchema = z
      .object({
        cin: z.string().min(8, "CIN must be at least 8 characters."),
        firstName: z
          .string()
          .min(5, "firstName must be at least 5 characters.")
          .max(32, "firstName must be at most 32 characters."),
        lastName: z
          .string()
          .min(5, "lastName must be at least 5 characters.")
          .max(32, "lastName must be at most 32 characters."),
        email: z.string().email("Invalid email address"),
        phoneNumber: z.string(),
        companyName: z.string().optional(),
        departement: z.string().optional(),
        address: z.string().optional(),
        role: z.string().optional(),
      });
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      address: "",
      confirmPassword: "",
      role: "",
      companyName: "",
      departement: "",
    },
  });

  useEffect(() => {
    loadRoles();
    if (type === "edit") {
      loadUserData();
    }
  }, []);
  const loadUserData = async () => {
    try {
      const res = await getUserById(id as string);
      if (res.status === 200) {
        form.reset({
          cin: res.data.cin,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          phoneNumber: res.data.phoneNumber,
          address: res.data.address,
          role: res.data.role?._id || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load user data. Please try again.");
    }
  };
  const { id, onClose, onUserChange } = useAddUserModal();

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
    //   const res = await createUser(data.firstName, data.lastName, data.email, data.phoneNumber, data.password, data.address);
    //   if (res.status === 201) {
    //     toast.success("User created successfully");
    //   }
    // } catch (error: any) {
    //   toast.error("Failed to create user. Please try again.");
    // }
    console.log(
      data.address,
      data.email,
      data.firstName,
      data.lastName,
      data.phoneNumber,
      data,
    );
    try {
      if (type === "add") {
        const response = await createUser(data);
        if (response.status === 201) {
          toast.success("User created successfully");
          form.reset();
          onClose();
          onUserChange();
        }
      }else{
        const response =await updateUser(id as string,data);
        if(response.status === 200 || response.status === 204){
          toast.success("User updated successfully");
          form.reset();
          onClose();
          onUserChange();
        }
      }
    } catch (error) {
      toast.error("Failed to update user. Please try again.");
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
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-firstName">
                    firstName
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-firstName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter firstName"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-lastName">
                    lastName
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-lastName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter lastName"
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
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-phoneNumber">
                    phoneNumber
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-phoneNumber"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter phoneNumber"
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
                    className="min-w-30"
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

          <div className="flex justify-between gap-x-3">
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-companyName">
                    Company Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-companyName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter company name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="departement"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-departement">
                    Department
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-departement"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter department"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {type === "edit" && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Change Password</h3>
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
                        placeholder="Leave empty to keep current password"
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
              </div>
            </>
          )}

          {type === "add" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📧 Note:</strong> A temporary password will be automatically generated and sent to the user's email address.
              </p>
            </div>
          )}
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
