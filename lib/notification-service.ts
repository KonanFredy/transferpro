'use client'

import { notificationsAPI } from './api'

// Types pour les notifications
export interface NotificationPayload {
  type: 'email' | 'sms' | 'both'
  recipient: {
    email?: string
    telephone?: string
    nom: string
    prenom: string
  }
  subject?: string
  template: NotificationTemplate
  data: Record<string, string | number>
}

export type NotificationTemplate = 
  | 'transaction_created'
  | 'transaction_validated'
  | 'transaction_cancelled'
  | 'transaction_withdrawn'
  | 'client_created'
  | 'user_created'
  | 'password_reset'

export interface NotificationResult {
  success: boolean
  emailSent?: boolean
  smsSent?: boolean
  message: string
}

// Templates de notifications
const emailTemplates: Record<NotificationTemplate, { subject: string; body: string }> = {
  transaction_created: {
    subject: 'Nouvelle transaction #{numero}',
    body: `Bonjour {prenom} {nom},

Votre transaction numero {numero} a ete creee avec succes.

Details de la transaction:
- Type: {type}
- Montant envoye: {montantEnvoye}
- Montant a recevoir: {montantRecu}
- Statut: En attente de validation

Merci de votre confiance.

L'equipe TransferPro`
  },
  transaction_validated: {
    subject: 'Transaction #{numero} validee',
    body: `Bonjour {prenom} {nom},

Votre transaction numero {numero} a ete validee.

Le montant de {montantRecu} est maintenant disponible pour retrait.

Code de retrait: {codeRetrait}

Merci de votre confiance.

L'equipe TransferPro`
  },
  transaction_cancelled: {
    subject: 'Transaction #{numero} annulee',
    body: `Bonjour {prenom} {nom},

Votre transaction numero {numero} a ete annulee.

Si vous avez des questions, veuillez nous contacter.

L'equipe TransferPro`
  },
  transaction_withdrawn: {
    subject: 'Transaction #{numero} - Retrait effectue',
    body: `Bonjour {prenom} {nom},

Le retrait pour la transaction numero {numero} a ete effectue avec succes.

Montant retire: {montantRecu}

Merci de votre confiance.

L'equipe TransferPro`
  },
  client_created: {
    subject: 'Bienvenue chez TransferPro',
    body: `Bonjour {prenom} {nom},

Votre compte client a ete cree avec succes.

Vous pouvez desormais effectuer des transferts et retraits d'argent via nos services.

L'equipe TransferPro`
  },
  user_created: {
    subject: 'Votre compte TransferPro a ete cree',
    body: `Bonjour {prenom} {nom},

Votre compte utilisateur TransferPro a ete cree.

Email: {email}
Role: {role}

Connectez-vous pour commencer a utiliser l'application.

L'equipe TransferPro`
  },
  password_reset: {
    subject: 'Reinitialisation de votre mot de passe',
    body: `Bonjour {prenom} {nom},

Une demande de reinitialisation de mot de passe a ete effectuee pour votre compte.

Cliquez sur le lien suivant pour reinitialiser votre mot de passe: {resetLink}

Ce lien expire dans 24 heures.

L'equipe TransferPro`
  }
}

const smsTemplates: Record<NotificationTemplate, string> = {
  transaction_created: 'TransferPro: Transaction {numero} creee. Montant: {montantEnvoye}. Statut: En attente.',
  transaction_validated: 'TransferPro: Transaction {numero} validee. Code retrait: {codeRetrait}. Montant: {montantRecu}.',
  transaction_cancelled: 'TransferPro: Transaction {numero} annulee. Contactez-nous pour plus d\'infos.',
  transaction_withdrawn: 'TransferPro: Retrait effectue pour transaction {numero}. Montant: {montantRecu}.',
  client_created: 'TransferPro: Bienvenue {prenom}! Votre compte client est actif.',
  user_created: 'TransferPro: Compte utilisateur cree. Email: {email}.',
  password_reset: 'TransferPro: Code de reinitialisation: {resetCode}. Valide 24h.'
}

// Fonction utilitaire pour remplacer les variables dans les templates
function replaceTemplateVars(template: string, data: Record<string, string | number>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }
  return result
}

// Simulation d'envoi d'email
async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string }> {
  // Simulation d'un delai reseau
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Log pour le developpement
  console.log('[v0] Email simule envoye:')
  console.log(`  To: ${to}`)
  console.log(`  Subject: ${subject}`)
  console.log(`  Body: ${body.substring(0, 100)}...`)
  
  // Simulation: 95% de succes
  const success = Math.random() > 0.05
  
  return {
    success,
    messageId: success ? `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
  }
}

// Simulation d'envoi de SMS
async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string }> {
  // Simulation d'un delai reseau
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Log pour le developpement
  console.log('[v0] SMS simule envoye:')
  console.log(`  To: ${to}`)
  console.log(`  Message: ${message}`)
  
  // Simulation: 98% de succes
  const success = Math.random() > 0.02
  
  return {
    success,
    messageId: success ? `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
  }
}

// Fonction principale d'envoi de notifications
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const { type, recipient, template, data } = payload
  
  // Preparer les donnees avec les infos du destinataire
  const fullData = {
    ...data,
    nom: recipient.nom,
    prenom: recipient.prenom,
    email: recipient.email || '',
  }
  
  let emailSent = false
  let smsSent = false
  const errors: string[] = []
  
  // Obtenir le template pour le sujet
  const emailTemplate = emailTemplates[template]
  const subject = replaceTemplateVars(emailTemplate.subject, fullData)
  const body = replaceTemplateVars(emailTemplate.body, fullData)
  
  // Envoi par email si necessaire
  if ((type === 'email' || type === 'both') && recipient.email) {
    const emailResult = await sendEmail(recipient.email, subject, body)
    emailSent = emailResult.success
    if (!emailResult.success) {
      errors.push('Echec envoi email')
    }
    
    // Sauvegarder dans l'historique local et backend
    addToNotificationHistory({
      type: 'email',
      recipient: recipient.email,
      subject: subject,
      status: emailResult.success ? 'sent' : 'failed'
    })
    
    // Essayer de sauvegarder au backend (silently fail si pas connecte)
    try {
      await notificationsAPI.create({
        type: 'email',
        recipient: recipient.email,
        subject: subject,
        message: body,
        status: emailResult.success ? 'sent' : 'failed'
      })
    } catch {
      // Silently fail - le backend peut ne pas etre disponible
    }
  }
  
  // Envoi par SMS si necessaire
  if ((type === 'sms' || type === 'both') && recipient.telephone) {
    const smsTemplate = smsTemplates[template]
    const message = replaceTemplateVars(smsTemplate, fullData)
    
    const smsResult = await sendSMS(recipient.telephone, message)
    smsSent = smsResult.success
    if (!smsResult.success) {
      errors.push('Echec envoi SMS')
    }
    
    // Sauvegarder dans l'historique local et backend
    addToNotificationHistory({
      type: 'sms',
      recipient: recipient.telephone,
      subject: message,
      status: smsResult.success ? 'sent' : 'failed'
    })
    
    // Essayer de sauvegarder au backend (silently fail si pas connecte)
    try {
      await notificationsAPI.create({
        type: 'sms',
        recipient: recipient.telephone,
        subject: `SMS: ${template}`,
        message: message,
        status: smsResult.success ? 'sent' : 'failed'
      })
    } catch {
      // Silently fail - le backend peut ne pas etre disponible
    }
  }
  
  const success = (type === 'email' && emailSent) || 
                  (type === 'sms' && smsSent) || 
                  (type === 'both' && (emailSent || smsSent))
  
  return {
    success,
    emailSent,
    smsSent,
    message: success 
      ? 'Notification envoyee avec succes' 
      : errors.join(', ') || 'Aucune notification envoyee'
  }
}

// Fonctions utilitaires pour des cas d'usage specifiques
export async function notifyTransactionCreated(
  client: { nom: string; prenom: string; telephone?: string; email?: string },
  transaction: { numero: string; type: string; montantEnvoye: string; montantRecu: string }
): Promise<NotificationResult> {
  return sendNotification({
    type: 'both',
    recipient: {
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
    },
    template: 'transaction_created',
    data: {
      numero: transaction.numero,
      type: transaction.type,
      montantEnvoye: transaction.montantEnvoye,
      montantRecu: transaction.montantRecu,
    }
  })
}

export async function notifyTransactionValidated(
  client: { nom: string; prenom: string; telephone?: string; email?: string },
  transaction: { numero: string; montantRecu: string; codeRetrait: string }
): Promise<NotificationResult> {
  return sendNotification({
    type: 'both',
    recipient: {
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
    },
    template: 'transaction_validated',
    data: {
      numero: transaction.numero,
      montantRecu: transaction.montantRecu,
      codeRetrait: transaction.codeRetrait,
    }
  })
}

export async function notifyTransactionCancelled(
  client: { nom: string; prenom: string; telephone?: string; email?: string },
  transactionNumero: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'both',
    recipient: {
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
    },
    template: 'transaction_cancelled',
    data: {
      numero: transactionNumero,
    }
  })
}

export async function notifyClientCreated(
  client: { nom: string; prenom: string; telephone?: string; email?: string }
): Promise<NotificationResult> {
  return sendNotification({
    type: 'both',
    recipient: {
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
    },
    template: 'client_created',
    data: {}
  })
}

export async function notifyUserCreated(
  user: { nom: string; prenom: string; email: string; role: string }
): Promise<NotificationResult> {
  return sendNotification({
    type: 'email',
    recipient: {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
    },
    template: 'user_created',
    data: {
      email: user.email,
      role: user.role === 'admin' ? 'Administrateur' : 'Agent',
    }
  })
}

// Historique des notifications (pour l'affichage)
export interface NotificationHistory {
  id: string
  type: 'email' | 'sms'
  recipient: string
  subject: string
  status: 'sent' | 'failed' | 'pending'
  timestamp: string
  read: boolean
}

// Parametres de notifications
export interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  transactionCreated: { email: boolean; sms: boolean }
  transactionValidated: { email: boolean; sms: boolean }
  transactionCancelled: { email: boolean; sms: boolean }
  transactionWithdrawn: { email: boolean; sms: boolean }
  clientCreated: { email: boolean; sms: boolean }
  userCreated: { email: boolean; sms: boolean }
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  smsProvider: 'twilio' | 'orange' | 'custom'
  smsApiKey: string
  smsApiSecret: string
}

// Store local pour les parametres (en memoire pour la demo)
let notificationSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: true,
  transactionCreated: { email: true, sms: true },
  transactionValidated: { email: true, sms: true },
  transactionCancelled: { email: true, sms: false },
  transactionWithdrawn: { email: true, sms: true },
  clientCreated: { email: true, sms: true },
  userCreated: { email: true, sms: false },
  smtpHost: 'smtp.example.com',
  smtpPort: '587',
  smtpUser: 'noreply@transferpro.com',
  smtpPassword: '',
  smsProvider: 'twilio',
  smsApiKey: '',
  smsApiSecret: ''
}

export function getNotificationSettings(): NotificationSettings {
  return { ...notificationSettings }
}

export function updateNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  notificationSettings = { ...notificationSettings, ...settings }
  return { ...notificationSettings }
}

// Store local pour l'historique (en memoire pour la demo)
let notificationHistory: NotificationHistory[] = [
  {
    id: 'notif_1',
    type: 'email',
    recipient: 'client@example.com',
    subject: 'Transaction #TRF-2026-001 validee',
    status: 'sent',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif_2',
    type: 'sms',
    recipient: '+221771234567',
    subject: 'Code retrait: RET123456',
    status: 'sent',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif_3',
    type: 'email',
    recipient: 'agent@transferpro.com',
    subject: 'Nouveau client inscrit',
    status: 'sent',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif_4',
    type: 'sms',
    recipient: '+221779876543',
    subject: 'Transaction #TRF-2026-002 creee',
    status: 'failed',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: true
  },
  {
    id: 'notif_5',
    type: 'email',
    recipient: 'admin@transferpro.com',
    subject: 'Nouvel utilisateur cree',
    status: 'sent',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true
  }
]

export function addToNotificationHistory(notification: Omit<NotificationHistory, 'id' | 'timestamp' | 'read'>): void {
  notificationHistory.unshift({
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false
  })
  
  // Garder seulement les 100 dernieres notifications
  if (notificationHistory.length > 100) {
    notificationHistory = notificationHistory.slice(0, 100)
  }
}

export function getNotificationHistory(): NotificationHistory[] {
  return [...notificationHistory]
}

export function getUnreadNotificationsCount(): number {
  return notificationHistory.filter(n => !n.read).length
}

export function markNotificationAsRead(id: string): void {
  const notification = notificationHistory.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

export function markAllNotificationsAsRead(): void {
  notificationHistory.forEach(n => n.read = true)
}

export function deleteNotification(id: string): void {
  notificationHistory = notificationHistory.filter(n => n.id !== id)
}

export function deleteAllNotifications(): void {
  notificationHistory = []
}

export function deleteNotificationsByStatus(status: 'sent' | 'failed' | 'pending'): void {
  notificationHistory = notificationHistory.filter(n => n.status !== status)
}
