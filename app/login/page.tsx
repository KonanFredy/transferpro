"use client";

import React from "react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast({
        title: "Connexion reussie",
        description: "Bienvenue sur TransferPro",
      });
      // Ne pas reset isLoading car on va etre redirige
      return;
    } else {
      toast({
        title: "Erreur de connexion",
        description: result.error || "Une erreur est survenue",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image and branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-black overflow-hidden">
        <Image
          src="/images/login-bg.jpg"
          alt="TransferPro Background"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/60" />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <ArrowLeftRight className="h-6 w-6 text-[oklch(0.65_0.12_45)]" />
            </div>
            <div>
              <span className="text-xl font-bold">TransferPro</span>
              <p className="text-xs text-white/70">Gestion Financiere</p>
            </div>
          </div>

          {/* Main message */}
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-balance">
              Gerez vos transactions financieres en toute simplicite
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Une plateforme complete pour les transferts et retraits d'argent,
              avec une gestion optimisee des taux de change et des clients.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.12_45)]/20 backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-[oklch(0.65_0.12_45)]" />
                </div>
                <div>
                  <p className="font-medium">Transactions rapides</p>
                  <p className="text-sm text-white/70">
                    Transferts traites en temps reel
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.12_45)]/20 backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-[oklch(0.65_0.12_45)]" />
                </div>
                <div>
                  <p className="font-medium">Securite maximale</p>
                  <p className="text-sm text-white/70">
                    Vos donnees sont protegees
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.12_45)]/20 backdrop-blur-sm">
                  <Globe className="h-5 w-5 text-[oklch(0.65_0.12_45)]" />
                </div>
                <div>
                  <p className="font-medium">Multi-devises</p>
                  <p className="text-sm text-white/70">
                    Support de nombreuses devises
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/60">
            2026 TransferPro. Tous droits reserves.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <ArrowLeftRight className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                Transfert-pro
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestion des Transactions Financieres
              </p>
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Bienvenue</h2>
            <p className="text-muted-foreground">
              Entrez vos identifiants pour acceder a votre espace
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isLoading}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Mot de passe oublie ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            En vous connectant, vous acceptez nos{" "}
            <button type="button" className="text-accent hover:underline">
              conditions d'utilisation
            </button>{" "}
            et notre{" "}
            <button type="button" className="text-accent hover:underline">
              politique de confidentialite
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
