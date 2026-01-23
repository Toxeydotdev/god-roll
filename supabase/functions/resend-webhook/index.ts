// Supabase Edge Function to receive inbound emails from Resend
// https://resend.com/docs/dashboard/receiving/custom-domains

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, resend-signature, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// =============================================================================
// TYPES
// =============================================================================

interface ResendEmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  content_disposition: string;
  content_id?: string;
}

interface ResendEmailReceivedEvent {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    message_id: string;
    subject: string;
    text?: string;
    html?: string;
    attachments: ResendEmailAttachment[];
  };
}

interface SupportTicket {
  email_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  status: "new" | "in_progress" | "resolved";
  attachments: ResendEmailAttachment[];
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION (Svix)
// =============================================================================

async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.warn("RESEND_WEBHOOK_SECRET not set - skipping verification");
    return true; // Allow in development
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers");
    return false;
  }

  // Check timestamp is within 5 minutes
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  // Construct signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Decode the secret (base64 with whsec_ prefix)
  const secretBytes = Uint8Array.from(
    atob(webhookSecret.replace("whsec_", "")),
    (c) => c.charCodeAt(0)
  );

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Generate expected signature
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  // Compare signatures (Svix sends multiple, check if any match)
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature === expectedSignature) {
      return true;
    }
  }

  console.error("Signature verification failed");
  return false;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.text();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(payload, req.headers);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(payload);

    // Handle email.received event
    if (event.type === "email.received") {
      const emailEvent = event as ResendEmailReceivedEvent;
      const {
        email_id,
        from,
        to,
        subject,
        text,
        html,
        attachments,
        created_at,
      } = emailEvent.data;

      console.log("=".repeat(60));
      console.log("📧 NEW SUPPORT EMAIL RECEIVED");
      console.log("=".repeat(60));
      console.log(`Email ID: ${email_id}`);
      console.log(`From: ${from}`);
      console.log(`To: ${to.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log(`Date: ${created_at}`);
      console.log(`Attachments: ${attachments?.length || 0}`);
      console.log("-".repeat(60));

      // Store in database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const ticket: SupportTicket = {
        email_id,
        from_email: from,
        to_email: to[0] || "",
        subject: subject || "(No subject)",
        body_text: text || null,
        body_html: html || null,
        received_at: created_at,
        status: "new",
        attachments: attachments || [],
      };

      const { error: insertError } = await supabase
        .from("support_tickets")
        .insert(ticket);

      if (insertError) {
        console.error("Failed to store support ticket:", insertError);
        // Still return 200 to acknowledge receipt
      } else {
        console.log("✅ Support ticket stored successfully");
      }

      // TODO: Send notification (Discord, Slack, email to team, etc.)

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email received",
          email_id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle other event types (bounces, deliveries, etc.)
    console.log(`Received webhook event: ${event.type}`);
    return new Response(JSON.stringify({ success: true, type: event.type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
