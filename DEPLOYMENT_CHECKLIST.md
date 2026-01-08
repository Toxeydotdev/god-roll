# Deployment Checklist

This checklist ensures proper deployment of the secure score submission system.

## Pre-Deployment

- [ ] 1. Review all code changes
  - [ ] `supabase/functions/submit-score/index.ts` - Edge Function with HMAC verification
  - [ ] `apps/web/src/lib/leaderboardService.ts` - Client-side signature generation
  - [ ] Documentation files created

- [ ] 2. Generate secure signing secret
  ```bash
  openssl rand -hex 32
  ```
  Save this value - you'll need it for both client and server!

- [ ] 3. Verify linting passes
  ```bash
  npm run lint
  ```

- [ ] 4. Review security documentation
  - [ ] Read `SECURITY_LIMITATIONS.md` to understand threat model
  - [ ] Review `TESTING_SECURITY.md` for testing procedures
  - [ ] Check `supabase/functions/submit-score/README.md` for API details

## Client-Side Deployment

- [ ] 1. Create/update `.env` file in `apps/web/`
  ```bash
  cd apps/web
  cp .env.example .env
  ```

- [ ] 2. Set environment variables in `.env`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_SCORE_SIGNING_SECRET=<generated-secret-from-step-2>
  ```

- [ ] 3. Build the client application
  ```bash
  npm run build:web
  ```

- [ ] 4. Deploy to hosting platform (Netlify, Vercel, etc.)
  - [ ] Ensure environment variables are set in platform settings
  - [ ] Deploy the built application

## Server-Side Deployment (Supabase)

- [ ] 1. Install Supabase CLI (if not already installed)
  ```bash
  npm install -g supabase
  ```

- [ ] 2. Login to Supabase
  ```bash
  supabase login
  ```

- [ ] 3. Link to your project
  ```bash
  supabase link --project-ref your-project-ref
  ```

- [ ] 4. Deploy the Edge Function
  ```bash
  supabase functions deploy submit-score
  ```

- [ ] 5. Set the signing secret (MUST match client-side)
  ```bash
  supabase secrets set SCORE_SIGNING_SECRET=<same-secret-as-client>
  ```

- [ ] 6. Verify the secret is set
  ```bash
  supabase secrets list
  ```
  You should see `SCORE_SIGNING_SECRET` in the list

## Post-Deployment Testing

### 1. Valid Score Submission Test

- [ ] Play the game normally
- [ ] Complete a game (roll a number divisible by 7)
- [ ] Submit score from Game Over screen
- [ ] Verify success message appears
- [ ] Check Supabase dashboard to confirm score was saved

### 2. Invalid Signature Test (Using cURL)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "X-Score-Signature: invalid-signature" \
  -d '{
    "player_name": "Test",
    "score": 100,
    "rounds_survived": 5,
    "session_id": "test-123",
    "timestamp": '$(date +%s000)'
  }'
```

- [ ] Verify you receive 401 Unauthorized
- [ ] Check error message: "Invalid signature - request rejected"

### 3. Rate Limiting Test

- [ ] Submit 5 valid scores quickly (< 1 minute)
- [ ] First 5 should succeed
- [ ] Attempt 6th submission
- [ ] Verify you receive 429 Too Many Requests
- [ ] Wait 60 seconds
- [ ] Verify you can submit again

### 4. Expired Timestamp Test

- [ ] Attempt to submit with old timestamp (10 minutes ago)
- [ ] Verify you receive 400 Bad Request
- [ ] Check error message about expired timestamp

### 5. Monitor Supabase Logs

- [ ] Go to Supabase Dashboard → Edge Functions → submit-score → Logs
- [ ] Verify you see successful submissions
- [ ] Check for any security warnings
- [ ] Look for rate limit violations if you did the rate limit test

## Troubleshooting

### "Invalid signature" on legitimate requests

**Problem**: All requests failing with "Invalid signature"

**Solutions**:
- [ ] Verify `VITE_SCORE_SIGNING_SECRET` matches `SCORE_SIGNING_SECRET`
- [ ] Ensure client app was rebuilt after setting env vars
- [ ] Check both secrets are exactly the same (no extra spaces/newlines)

### "Server configuration error"

**Problem**: Server returns 500 with "Server configuration error"

**Solutions**:
- [ ] Verify `SCORE_SIGNING_SECRET` is set in Supabase
- [ ] Check secret name is exactly `SCORE_SIGNING_SECRET` (case-sensitive)
- [ ] Redeploy Edge Function after setting secret

### "Client configuration error"

**Problem**: Client shows "Client configuration error"

**Solutions**:
- [ ] Verify `.env` file exists and has `VITE_SCORE_SIGNING_SECRET`
- [ ] Rebuild client application after adding env var
- [ ] Check hosting platform has env var set (not just local `.env`)

### Rate limits triggering for normal play

**Problem**: Legitimate players hitting rate limits

**Solutions**:
- [ ] Review `RATE_LIMIT_REQUESTS` in Edge Function
- [ ] Consider increasing to 10 requests per minute
- [ ] Redeploy after making changes

## Monitoring Setup

### 1. Supabase Dashboard

- [ ] Set up email alerts for Edge Function errors
- [ ] Monitor function invocation count
- [ ] Review logs daily for security warnings

### 2. Security Metrics to Track

- [ ] Invalid signature attempts (should be rare)
- [ ] Rate limit violations (should be minimal)
- [ ] Expired timestamp errors (should be rare)
- [ ] Score sanity check failures (investigate these!)

### 3. Score Distribution Analysis

- [ ] Export leaderboard data weekly
- [ ] Analyze score distributions
- [ ] Flag statistical outliers
- [ ] Investigate suspicious patterns

## Rollback Plan

If issues occur after deployment:

### Client Rollback
- [ ] Revert to previous client deployment
- [ ] Previous version won't submit scores (no signature)
- [ ] Users can still play offline

### Server Rollback
- [ ] Deploy previous version of Edge Function
- [ ] Or temporarily disable signature verification (NOT RECOMMENDED)

### Emergency Fix
If signature verification causes issues:
1. Add feature flag in Edge Function to temporarily disable verification
2. Deploy fixed version
3. Re-enable verification

## Success Criteria

Deployment is successful when:

- [ ] ✅ Users can play the game normally
- [ ] ✅ Valid scores submit successfully
- [ ] ✅ Invalid signatures are rejected (tested with cURL)
- [ ] ✅ Rate limiting works (tested)
- [ ] ✅ No errors in Supabase logs
- [ ] ✅ Leaderboard displays submitted scores
- [ ] ✅ All tests in TESTING_SECURITY.md pass

## Security Review

After deployment, within 1 week:

- [ ] Review Supabase logs for security warnings
- [ ] Analyze score distributions for anomalies
- [ ] Check for any unauthorized access attempts
- [ ] Verify rate limiting is working as expected
- [ ] Review any user reports of issues

## Documentation Review

Ensure team members have access to:

- [ ] `README.md` - Overview and setup
- [ ] `SECURITY_LIMITATIONS.md` - Security model and limitations
- [ ] `TESTING_SECURITY.md` - Testing procedures
- [ ] `IMPLEMENTATION_SUMMARY.md` - Technical details
- [ ] `supabase/functions/submit-score/README.md` - API documentation

## Sign-off

- [ ] Developer: Implementation complete and tested
- [ ] Code Review: Security review passed
- [ ] QA: Manual testing completed
- [ ] DevOps: Deployment successful
- [ ] Product Owner: Feature approved

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Sign-off**: _________________

## Notes

_Add any deployment-specific notes here_
