# Security Considerations and Limitations

## Overview

This document outlines the security model, limitations, and recommendations for the God Roll score submission system.

## Security Model

The current implementation uses a **shared secret** approach with HMAC signature verification. This provides protection against:

- ✅ Casual cheating via browser DevTools
- ✅ Simple cURL/Postman score submissions without knowledge of the secret
- ✅ Replay attacks (via timestamp validation)
- ✅ Brute force attacks (via rate limiting)
- ✅ Score manipulation (signature covers entire payload)

## Known Limitations

### 1. Client-Side Secret Exposure ⚠️ CRITICAL

**Issue**: The signing secret (`VITE_SCORE_SIGNING_SECRET`) is embedded in the client bundle and visible to anyone who inspects the JavaScript code.

**Impact**: Determined attackers can:
- Extract the secret from the bundled JavaScript
- Generate valid signatures for fake scores
- Submit fraudulent scores that pass all validation

**Why This Exists**: 
- Client-side games fundamentally cannot hide secrets from determined attackers
- This is a limitation of browser-based games in general
- The shared secret approach is used because it's simple and provides reasonable protection

**Mitigation Level**: Moderate protection against casual cheating, but bypassable by determined attackers

**Production Recommendations**:

#### Option A: Server-Side Game State (Most Secure)
- Run the game logic on the server
- Client only renders the game state
- Server validates all moves and calculates scores
- **Pros**: Eliminates client-side cheating
- **Cons**: Requires WebSocket/polling, increases server costs, adds latency

#### Option B: Session Tokens (Better)
- Generate a unique session token server-side when game starts
- Use this token (not a shared secret) to sign score submissions
- Token is tied to the user's session and can be invalidated
- **Pros**: Each game session has a unique token, harder to abuse
- **Cons**: Requires session management, still bypassable

#### Option C: Challenge-Response (Better)
- Server provides a challenge when game starts
- Client signs the challenge + score
- Server verifies the response
- **Pros**: One-time use, harder to replay
- **Cons**: Requires round-trip, more complex

#### Option D: WebAssembly Obfuscation (Defense in Depth)
- Compile signature generation to WebAssembly
- Makes secret extraction harder (but not impossible)
- **Pros**: Raises the bar for attackers
- **Cons**: Still not truly secure, adds complexity

#### Option E: Accept the Risk (Current Approach)
- Use shared secret as a "speedbump" against casual cheating
- Rely on server-side score sanity checks
- Monitor for suspicious patterns and ban outliers
- **Pros**: Simple, works for casual games
- **Cons**: Vulnerable to determined attackers

**Recommendation**: For a casual dice game, **Option E** (current approach) is acceptable. For games with real prizes or competitive leaderboards, implement **Option A** or **Option B**.

### 2. Rate Limiting Reset on Cold Start

**Issue**: The in-memory rate limit storage is reset when the Supabase Edge Function cold starts.

**Impact**: Attackers could potentially:
- Wait for cold starts to bypass rate limits
- Submit multiple requests during the cold start period

**Mitigation**: 
- For production, consider storing rate limit data in Supabase database
- Use Redis or similar for distributed rate limiting
- Current approach is acceptable for low-traffic applications

### 3. IP-Based Rate Limiting Limitations

**Issue**: IP-based rate limiting can be affected by:
- Users behind NAT/shared IPs (corporate networks, mobile networks)
- Attackers using VPNs or proxies to rotate IPs
- CDN/proxy header spoofing

**Mitigation**:
- Current implementation validates IP format to prevent obvious spoofing
- Consider combining with user-agent fingerprinting
- Consider requiring authentication for score submission

### 4. Constant-Time Comparison

**Current Implementation**: Custom constant-time comparison using XOR and bitwise OR.

**Limitation**: While this prevents basic timing attacks, it's not as robust as purpose-built cryptographic libraries.

**Note**: The early return for length mismatch could theoretically leak timing information, but this is a minimal risk since:
- HMAC signatures are always the same length (64 hex chars for SHA-256)
- The length check is a constant-time operation itself

**Recommendation**: For production, consider using a well-tested cryptographic library if available in Deno.

### 5. Score Sanity Checks

**Current Implementation**: Validates that score doesn't exceed theoretical maximum based on rounds survived.

**Limitation**: This assumes:
- The maximum dice roll per die is 6
- The calculation is: `((rounds * (rounds + 1)) / 2) * 6`
- This may not account for all edge cases

**Recommendation**: Monitor actual score distributions and flag outliers.

### 6. Session ID Uniqueness

**Current Implementation**: Relies on client-generated session IDs to prevent duplicate submissions.

**Limitation**: 
- Client could generate multiple session IDs for the same game
- No verification that session IDs are actually unique or valid

**Recommendation**: Generate session IDs server-side or implement session validation.

## Best Practices for Production

1. **Monitor and Alert**
   - Log all security-related rejections
   - Monitor for patterns of abuse
   - Set up alerts for suspicious activity

2. **Analyze Score Distributions**
   - Track statistical distributions of scores
   - Flag outliers for manual review
   - Implement percentile-based thresholds

3. **Regular Secret Rotation**
   - Rotate the signing secret periodically
   - Implement graceful secret rotation (accept old and new)

4. **Database Rate Limiting**
   - Move rate limiting to Supabase database or Redis
   - Ensures persistence across function restarts

5. **Additional Validations**
   - Implement time-to-complete validation (games shouldn't finish too quickly)
   - Track player history and flag sudden skill jumps
   - Implement CAPTCHA for suspicious submissions

6. **Consider Authentication**
   - Require user authentication for leaderboard submission
   - Track scores per user account
   - Enables banning abusive users

## Threat Model

### Threats Mitigated

| Threat | Severity | Mitigated? | How |
|--------|----------|------------|-----|
| Casual cheating via DevTools | Medium | ✅ Yes | Signature verification |
| Simple API abuse (cURL/Postman) | Medium | ✅ Yes | Signature verification |
| Replay attacks | Medium | ✅ Yes | Timestamp validation |
| Brute force | High | ✅ Yes | Rate limiting |
| Score tampering | Medium | ✅ Yes | Signature covers payload |

### Threats NOT Fully Mitigated

| Threat | Severity | Mitigated? | Notes |
|--------|----------|------------|-------|
| Client code inspection | High | ⚠️ Partial | Secret visible in bundle |
| Sophisticated attackers | High | ❌ No | Can extract secret and forge requests |
| Distributed attacks | Medium | ⚠️ Partial | Rate limiting per IP, but IPs can be rotated |
| Time-based attacks | Low | ⚠️ Partial | Constant-time comparison helps but isn't perfect |

## Conclusion

The current implementation provides **reasonable protection for a casual browser game** but should not be considered secure against determined attackers. The primary defense is making cheating "annoying enough" that most players won't bother.

For production deployment:
1. Accept that client-side secrets can be extracted
2. Focus on detection and response rather than prevention
3. Monitor for abuse patterns and respond quickly
4. Consider implementing server-side game state for high-stakes scenarios

Remember: **In client-side games, the client is always in hostile territory.** Perfect security is impossible; the goal is to make cheating difficult enough that it's not worth the effort for most players.
