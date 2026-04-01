import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'manaa'
const ROOT_DOMAIN = 'app.usemanaa.com'
const FROM_ADDRESS = `manaa <noreply@${ROOT_DOMAIN}>`
const RESEND_API_URL = 'https://api.resend.com/emails'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited to manaa",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Supabase auth hook payload shape:
  // { user: { email }, email_data: { email_action_type, token, token_hash, redirect_to, site_url } }
  const user = payload?.user
  const emailData = payload?.email_data

  if (!user?.email || !emailData?.email_action_type) {
    return new Response(JSON.stringify({ error: 'Invalid hook payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = emailData.email_action_type
  const siteUrl = `https://${ROOT_DOMAIN}`

  // Build confirmation URL from token hash + redirect
  const confirmationUrl = emailData.redirect_to
    ? `${emailData.site_url || siteUrl}/auth/confirm?token_hash=${emailData.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(emailData.redirect_to)}`
    : emailData.redirect_to || siteUrl

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type:', emailType)
    // Return 200 so Supabase doesn't retry — just skip unknown types
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl,
    recipient: user.email,
    confirmationUrl,
    token: emailData.token,
    email: user.email,
    newEmail: emailData.new_email,
  }

  let html: string
  let text: string
  try {
    html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
      plainText: true,
    })
  } catch (err) {
    console.error('Template render error:', err)
    return new Response(JSON.stringify({ error: 'Failed to render email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const subject = EMAIL_SUBJECTS[emailType] || 'Notification from manaa'

  const resendRes = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [user.email],
      subject,
      html,
      text,
    }),
  })

  if (!resendRes.ok) {
    const resendError = await resendRes.text()
    console.error('Resend API error:', resendError)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const result = await resendRes.json()
  console.log('Email sent:', { type: emailType, to: user.email, id: result.id })

  // Supabase auth hook expects an empty object on success
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
