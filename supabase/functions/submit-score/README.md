# Submit Score Edge Function

This Supabase Edge Function handles secure score submissions for the God Roll leaderboard.

## Security Features

### 1. HMAC Signature Verification
- All score submissions must include a valid HMAC-SHA256 signature
- The signature is sent in the `X-Score-Signature` header
- Prevents unauthorized score submissions from outside the game client

### 2. Rate Limiting
- Limits score submissions to 5 requests per minute per IP address
- Returns HTTP 429 (Too Many Requests) when limit is exceeded
- Uses in-memory storage for rate limit tracking

### 3. Timestamp Validation
- All submissions must include a timestamp in the payload
- Rejects requests with timestamps older than 5 minutes
- Prevents replay attacks

### 4. Existing Validations
- Player name validation (3-20 chars, alphanumeric + spaces)
- Score sanity check (max possible score based on rounds survived)
- Session ID duplicate check (prevents multiple submissions for same game)

## Environment Variables

### Required
- `SCORE_SIGNING_SECRET` - Shared secret key for HMAC signature verification
  - Generate with: `openssl rand -hex 32`
  - Must match `VITE_SCORE_SIGNING_SECRET` on the client side
  - Set in Supabase Dashboard → Edge Functions → Secrets

- `SUPABASE_URL` - Your Supabase project URL (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (automatically set)

## Request Format

```typescript
POST /functions/v1/submit-score
Headers:
  Content-Type: application/json
  X-Score-Signature: <hmac-sha256-hex-signature>
  Authorization: Bearer <supabase-anon-key>

Body:
{
  "player_name": "PlayerName",
  "score": 150,
  "rounds_survived": 5,
  "session_id": "unique-session-id",
  "timestamp": 1704704400000
}
```

## Response Codes

- `200` - Success
- `400` - Invalid data (validation errors, expired timestamp)
- `401` - Authentication error (missing or invalid signature)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Server error

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy submit-score

# Set the secret
supabase secrets set SCORE_SIGNING_SECRET=your-secret-here
```
