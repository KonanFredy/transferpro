'use client'

import React from "react"
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftRight, ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({ 
        title: 'Erreur', 
        description: 'Veuillez entrer votre adresse email',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      await authAPI.forgotPassword(email)
      setIsSuccess(true)
      toast({ 
        title: 'Email envoye', 
        description: 'Verifiez votre boite de reception pour reinitialiser votre mot de passe' 
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      // Still show success to prevent email enumeration
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image and branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary overflow-hidden">
        <Image
          src="/images/login-bg.jpg"
          alt="TransferPro Background"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/70" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold">TransferPro</span>
              <p className="text-xs text-primary-foreground/70">Gestion Financiere</p>
            </div>
          </div>

          {/* Main message */}
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-balance">
              Securisez votre compte en toute simplicite
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Nous vous aiderons a recuperer l'acces a votre compte en quelques etapes simples.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-primary-foreground/60">
            2026 TransferPro. Tous droits reserves.
          </p>
        </div>
      </div>

      {/* Right side - Forgot password form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <ArrowLeftRight className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">TransferPro</h1>
              <p className="text-sm text-muted-foreground">Gestion des Transactions Financieres</p>
            </div>
          </div>

          {/* Back link */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la connexion
          </Link>

          {isSuccess ? (
            /* Success state */
            <div className="space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-foreground">Email envoye !</h2>
                <p className="text-muted-foreground">
                  Si un compte existe avec l'adresse <span className="font-medium text-foreground">{email}</span>, 
                  vous recevrez un email avec les instructions pour reinitialiser votre mot de passe.
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full h-12">
                  <Link href="/login">
                    Retourner a la connexion
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 bg-transparent"
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail('')
                  }}
                >
                  Essayer avec une autre adresse
                </Button>
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              {/* Form header */}
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Mot de passe oublie ?</h2>
                <p className="text-muted-foreground">
                  Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
                </p>
              </div>

              {/* Forgot password form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien de reinitialisation'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
