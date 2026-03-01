"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  MapPin,
  Award,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { getCurrentUser } from "@/app/action/auth.action";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne doit pas dépasser 50 caractères"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne doit pas dépasser 50 caractères"),
  email: z.string().email("Email invalide"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  departement: z.string().optional(),
  companyName: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const authUser = useAuthStore((state) => state.user);
  //const getCurrentUser = useAuthStore((state) => state.getCurrentUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      departement: "",
      companyName: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoadingData(true);
    try {
      console.log("Fetching current user data...");
      const userData = (await getCurrentUser(authUser)).data;
      console.log("User data fetched:", userData);
      if (userData) {
        setUser(userData);
        console.log("Current user data:", userData);
      }
    } catch (error: any) {
      console.error("Error loading user:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setIsLoadingData(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      if (updateProfile) {
        const result = await updateProfile(data);
        if (result && !result.error) {
          toast.success("Profil mis à jour avec succès!");
          setUser({ ...user, ...data });
          setIsEditing(false);
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour");
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la mise à jour du profil",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const res = await axios.put(
        "http://localhost:3000/users/me/password",
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${authUser?.access_token}`,
          },
        },
      );

      toast.success("Mot de passe changé avec succès!");
      passwordForm.reset();
      setIsEditingPassword(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors du changement de mot de passe",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">
          Impossible de charger les données du profil
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informations Personnelles</CardTitle>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  profileForm.reset();
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={profileForm.handleSubmit(handleSaveProfile)}
                disabled={isLoading}
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>

            {!isEditing ? (
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-500">CIN: {user.cin}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">
                        {user.email || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="font-medium">{user.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="font-medium">{user.address}</p>
                      </div>
                    </div>
                  )}
                  {user.departement && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Shield className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-xs text-gray-500">Département</p>
                        <p className="font-medium">{user.departement}</p>
                      </div>
                    </div>
                  )}
                  {user.companyName && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-xs text-gray-500">Entreprise</p>
                        <p className="font-medium">{user.companyName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Inscrit le</p>
                      <p className="font-medium">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {user.certifications && user.certifications.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm font-medium text-gray-700">
                        Certifications
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.certifications.map((cert: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup>
                    <Controller
                      name="firstName"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                          <Input {...field} id="firstName" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="lastName"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="lastName">Nom</FieldLabel>
                          <Input {...field} id="lastName" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="email"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="email">Email</FieldLabel>
                          <Input {...field} id="email" type="email" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="phoneNumber"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="phoneNumber">
                            Téléphone
                          </FieldLabel>
                          <Input {...field} id="phoneNumber" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup className="md:col-span-2">
                    <Controller
                      name="address"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="address">Adresse</FieldLabel>
                          <Input {...field} id="address" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="departement"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="departement">
                            Département
                          </FieldLabel>
                          <Input {...field} id="departement" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="companyName"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="companyName">
                            Entreprise
                          </FieldLabel>
                          <Input {...field} id="companyName" />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sécurité</CardTitle>
          {!isEditingPassword && (
            <Button
              onClick={() => setIsEditingPassword(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Changer le mot de passe
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingPassword ? (
            <form
              onSubmit={passwordForm.handleSubmit(handleChangePassword)}
              className="space-y-4 max-w-md"
            >
              <FieldGroup>
                <Controller
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="currentPassword">
                        Mot de passe actuel
                      </FieldLabel>
                      <Input {...field} id="currentPassword" type="password" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="newPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="newPassword">
                        Nouveau mot de passe
                      </FieldLabel>
                      <Input {...field} id="newPassword" type="password" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="confirmPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input {...field} id="confirmPassword" type="password" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditingPassword(false);
                    passwordForm.reset();
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Enregistrement..." : "Changer le mot de passe"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600">
              Cliquez sur "Changer le mot de passe" pour mettre à jour votre mot
              de passe.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Statut du Compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Statut</p>
              <Badge
                variant={user.status === "approved" ? "secondary" : "default"}
                className="text-sm"
              >
                {user.status === "approved"
                  ? "Approuvé"
                  : user.status === "pending"
                    ? "En attente"
                    : "Actif"}
              </Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Email vérifié</p>
              <Badge
                variant={user.emailVerified ? "secondary" : "destructive"}
                className="text-sm"
              >
                {user.emailVerified ? "Oui" : "Non"}
              </Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Compte actif</p>
              <Badge
                variant={user.isActif ? "secondary" : "destructive"}
                className="text-sm"
              >
                {user.isActif ? "Oui" : "Non"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
