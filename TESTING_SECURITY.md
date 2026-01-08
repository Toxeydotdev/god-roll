# Testing Guide for Secure Score Submission

This document explains how to test the HMAC signature verification and rate limiting features.

## Prerequisites

1. Set up environment variables:
   ```bash
   # Client-side (.env file in apps/web/)
   VITE_SCORE_SIGNING_SECRET=your-secret-key-here
   
   # Server-side (Supabase Edge Function)
   supabase secrets set SCORE_SIGNING_SECRET=your-secret-key-here
   ```
   
   **Important**: Both values must be identical!

2. Generate a secure secret:
   ```bash
   openssl rand -hex 32
   ```

## Test Cases

### 1. Valid Score Submission (Should Succeed)

**Test**: Submit a score with valid signature and timestamp

**Steps**:
1. Play the game normally
2. Complete a game (roll a number divisible by 7)
3. Submit score from the Game Over screen
4. Verify success message appears

**Expected**: Score is submitted successfully and appears in the global leaderboard

**Server Logs to Check**:
- No security warnings
- Score inserted successfully

---

### 2. Invalid Signature (Should Fail)

**Test**: Attempt to submit score with wrong signature using cURL/Postman

**Steps**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "X-Score-Signature: invalid-signature-123" \
  -d '{
    "player_name": "Hacker",
    "score": 9999999,
    "rounds_survived": 100,
    "session_id": "fake-session",
    "timestamp": '$(date +%s000)'
  }'
```

**Expected**: 
- HTTP 401 Unauthorized
- Error message: "Invalid signature - request rejected"

**Server Logs**:
- Warning: "Invalid signature from IP: x.x.x.x"

---

### 3. Missing Signature (Should Fail)

**Test**: Attempt to submit score without signature header

**Steps**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "player_name": "Hacker",
    "score": 9999999,
    "rounds_survived": 100,
    "session_id": "fake-session",
    "timestamp": '$(date +%s000)'
  }'
```

**Expected**: 
- HTTP 401 Unauthorized
- Error message: "Missing signature - request rejected"

**Server Logs**:
- Warning: "Missing signature from IP: x.x.x.x"

---

### 4. Expired Timestamp (Should Fail)

**Test**: Attempt to submit score with old timestamp (> 5 minutes)

**Steps**:
```bash
# Calculate timestamp from 10 minutes ago
OLD_TIMESTAMP=$(($(date +%s) - 600))000

# Generate valid signature for old payload (would need the secret)
curl -X POST https://your-project.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "X-Score-Signature: [generated-for-old-timestamp]" \
  -d '{
    "player_name": "Test",
    "score": 100,
    "rounds_survived": 5,
    "session_id": "test-session",
    "timestamp": '$OLD_TIMESTAMP'
  }'
```

**Expected**: 
- HTTP 400 Bad Request
- Error message: "Request timestamp expired - please try again"

**Server Logs**:
- Warning: "Timestamp too old from IP: x.x.x.x, diff: [ms]"

---

### 5. Rate Limiting (Should Fail After 5 Requests)

**Test**: Submit 6+ scores rapidly from the same IP

**Steps**:
1. Submit 5 valid scores in quick succession (< 1 minute)
2. Attempt to submit a 6th score

**Expected**:
- First 5 submissions: Success (200 OK)
- 6th submission: HTTP 429 Too Many Requests
- Error message: "Too many requests. Please try again in X seconds."
- Response includes "Retry-After" header

**Server Logs**:
- Warning: "Rate limit exceeded for IP: x.x.x.x, retry after Xs"

**Recovery**: Wait 60 seconds, then try again (should succeed)

---

### 6. Duplicate Session ID (Should Fail)

**Test**: Submit same session_id twice with valid signatures

**Steps**:
1. Submit a score with session_id "unique-test-123"
2. Attempt to submit another score with the same session_id

**Expected**:
- First submission: Success (200 OK)
- Second submission: HTTP 400 Bad Request
- Error message: "Score already submitted for this session"

---

### 7. Invalid Score Data (Should Fail)

**Test**: Submit score that exceeds maximum possible

**Steps**:
Submit a score with:
- rounds_survived: 5
- score: 10000 (max possible for 5 rounds is much lower)

**Expected**:
- HTTP 400 Bad Request
- Error message: "Score exceeds maximum possible"

---

## Automated Testing with Test Script

Run the included test script to verify HMAC signature generation:

```bash
node /tmp/test-hmac-signature.js
```

**Expected Output**:
```
✅ SUCCESS: Signatures match!
The client and server will be able to verify each other's signatures.
```

---

## Monitoring

### Key Metrics to Monitor:

1. **Invalid Signature Attempts**
   - Log pattern: "Invalid signature from IP"
   - Could indicate attack attempts

2. **Rate Limit Violations**
   - Log pattern: "Rate limit exceeded for IP"
   - Could indicate bot activity or DoS attempts

3. **Expired Timestamps**
   - Log pattern: "Timestamp too old from IP"
   - Could indicate replay attack attempts

### Recommended Actions:

- Monitor logs for patterns of abuse
- Consider IP blocking for repeated violations
- Consider adjusting rate limits based on legitimate usage patterns

---

## Troubleshooting

### Problem: All requests fail with "Invalid signature"

**Solution**: Verify that VITE_SCORE_SIGNING_SECRET (client) and SCORE_SIGNING_SECRET (server) are identical

### Problem: "Server configuration error"

**Solution**: Ensure SCORE_SIGNING_SECRET is set in Supabase Edge Function secrets

### Problem: "Client configuration error"

**Solution**: Ensure VITE_SCORE_SIGNING_SECRET is set in .env file and app is rebuilt

### Problem: Rate limits triggering for legitimate users

**Solution**: Consider increasing RATE_LIMIT_REQUESTS (current: 5/minute) or RATE_LIMIT_WINDOW_MS in the Edge Function
