import { User as UserIcon, Mail, Phone, Calendar, Shield, Check, X, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { roleLabels } from '../../utils/roleConfig';
import { toast } from 'sonner';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { PasswordGenerator } from '../../utils/passwordGenerator';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const [editData, setEditData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState({ 
    score: 0, 
    strength: 'Très faible' as const, 
    color: 'bg-red-500',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      noSpaces: false,
    }
  });
  const [showPasswordSuggestions, setShowPasswordSuggestions] = useState(false);
  const [passwordSuggestions, setPasswordSuggestions] = useState<string[]>([]);

  // Mettre à jour la force du mot de passe quand l'utilisateur tape
  useEffect(() => {
    if (passwords.new) {
      const strength = PasswordGenerator.evaluatePasswordStrength(passwords.new);
      setPasswordStrength(strength);
      setShowPasswordSuggestions(true);
    } else {
      setShowPasswordSuggestions(false);
    }
  }, [passwords.new]);

  // Générer des suggestions de mots de passe forts
  const generatePasswordSuggestions = () => {
    const suggestions = PasswordGenerator.generateSuggestions(5);
    setPasswordSuggestions(suggestions);
  };

  // Utiliser une suggestion spécifique
  const useSuggestion = (suggestion: string) => {
    setPasswords({ ...passwords, new: suggestion, confirm: '' });
    toast.success('Mot de passe suggéré appliqué!');
  };

  // Générer un nouveau mot de passe fort
  const generateNewPassword = () => {
    const newPassword = PasswordGenerator.generateStrongPassword(14);
    setPasswords({ ...passwords, new: newPassword, confirm: '' });
    generatePasswordSuggestions(); // Générer aussi des suggestions alternatives
    toast.success('Nouveau mot de passe fort généré!');
  };

  if (!user) return null;

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  const handleSaveProfile = () => {
    if (!editData.firstname || !editData.lastname) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    toast.success('Profil mis à jour avec succès!');
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Tous les champs de mot de passe sont requis');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    if (!PasswordGenerator.isStrongPassword(passwords.new)) {
      toast.error('Le mot de passe est trop faible. Veuillez choisir un mot de passe plus fort.');
      return;
    }
    
    toast.success('Mot de passe changé avec succès!');
    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordSuggestions(false);
    setPasswordSuggestions([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-2xl">
                {getInitials(user.firstname, user.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="flex gap-3 pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                      Modifier le Profil
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier le Profil</DialogTitle>
                      <DialogDescription>
                        Mettez à jour vos informations personnelles
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstname">Prénom</Label>
                          <Input
                            id="firstname"
                            value={editData.firstname}
                            onChange={(e) => setEditData({ ...editData, firstname: e.target.value })}
                            placeholder="Prénom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastname">Nom</Label>
                          <Input
                            id="lastname"
                            value={editData.lastname}
                            onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                            placeholder="Nom"
                          />
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleSaveProfile}
                      >
                        Sauvegarder les modifications
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Changer le Mot de Passe</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Changer le Mot de Passe</DialogTitle>
                      <DialogDescription>
                        Entrez votre mot de passe actuel et votre nouveau mot de passe
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Formulaire principal */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current">Mot de Passe Actuel</Label>
                          <Input
                            id="current"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            placeholder="Entrez votre mot de passe actuel"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="new">Nouveau Mot de Passe</Label>
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="sm"
                                      onClick={generateNewPassword}
                                      className="text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Générer
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Génère un mot de passe fort</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Input
                            id="new"
                            type="text" // Changé en text pour voir le mot de passe généré
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            placeholder="Entrez votre nouveau mot de passe"
                            className="font-mono"
                          />
                          
                          {showPasswordSuggestions && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Force du mot de passe:</span>
                                <span className={`text-sm font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                  {passwordStrength.strength}
                                </span>
                              </div>
                              <Progress 
                                value={(passwordStrength.score / 6) * 100} 
                                className={passwordStrength.color}
                              />
                              
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.length ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>12+ caractères</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.uppercase ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>Majuscule</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.lowercase ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>Minuscule</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.number ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>Chiffre</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.special ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>Caractère spécial</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {passwordStrength.checks.noSpaces ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <X className="h-3 w-3 text-red-500" />}
                                  <span>Pas d'espaces</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm">Confirmer le Mot de Passe</Label>
                          <Input
                            id="confirm"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            placeholder="Confirmez votre nouveau mot de passe"
                          />
                          {passwords.confirm && passwords.new !== passwords.confirm && (
                            <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                          )}
                        </div>
                      </div>

                      {/* Suggestions de mots de passe */}
                      {passwordSuggestions.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-3">Autres suggestions de mots de passe forts:</h4>
                          <div className="space-y-2">
                            {passwordSuggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <code className="font-mono text-sm">{suggestion}</code>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => useSuggestion(suggestion)}
                                  className="text-xs text-blue-600"
                                >
                                  Utiliser
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleChangePassword}
                      >
                        Mettre à jour le mot de passe
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}