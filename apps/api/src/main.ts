import cors from "cors";
import crypto from "crypto";
import express from "express";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Resend webhook signing secret (set this in your environment)
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET ?? "";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

// Example API endpoint
app.get("/api", (_req, res) => {
  res.send({ message: "Welcome to god-roll API!" });
});

// =============================================================================
// RESEND WEBHOOK - Receive inbound emails
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

// Verify Resend webhook signature
function verifyResendSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn("Missing signature or secret for webhook verification");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook endpoint for receiving emails
app.post(
  "/api/webhooks/resend",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["resend-signature"] as string | undefined;
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Verify signature in production
    if (
      RESEND_WEBHOOK_SECRET &&
      !verifyResendSignature(rawBody, signature, RESEND_WEBHOOK_SECRET)
    ) {
      console.error("Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    try {
      const event =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      if (event.type === "email.received") {
        const emailEvent = event as ResendEmailReceivedEvent;
        const { from, to, subject, text } = emailEvent.data;

        console.log("=".repeat(60));
        console.log("📧 NEW SUPPORT EMAIL RECEIVED");
        console.log("=".repeat(60));
        console.log(`From: ${from}`);
        console.log(`To: ${to.join(", ")}`);
        console.log(`Subject: ${subject}`);
        console.log(`Date: ${emailEvent.created_at}`);
        console.log("-".repeat(60));
        console.log("Message:");
        console.log(text || "(No plain text body)");
        console.log("=".repeat(60));

        // TODO: Store in database, forward to team, create ticket, etc.
        // For now, we just log it

        res.status(200).json({
          success: true,
          message: "Email received",
          email_id: emailEvent.data.email_id,
        });
        return;
      }

      // Handle other event types (bounces, deliveries, etc.)
      console.log(`Received webhook event: ${event.type}`);
      res.status(200).json({ success: true, type: event.type });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  }
);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
