# Comprehensive Error Fix Implementation Plan

## 1. Critical Build-Blocking Dependencies

### 1.1 Missing OpenAI Package
**File:** `package.json`
**Issue:** OpenAI package is imported in `src/app/api/transcribe-and-summarize/route.ts` but not listed in dependencies
**Fix:** Add to dependencies
```json
"openai": "^4.20.1"
```

### 1.2 Incorrect Better-Auth Adapter Import
**File:** `src/lib/auth.ts`
**Issue:** Import path `better-auth/adapters/neon` is incorrect
**Fix:** Change import to
```typescript
import { neonAdapter } from "better-auth/adapters/neon";
```
**Note:** This may require installing the correct adapter package if not already included

## 2. Next.js 15 Compatibility Issues

### 2.1 API Route Parameter Handling
**Files:** 
- `src/app/api/notes/[id]/route.ts` (lines 8-11, 53-56)
- `src/app/api/transcribe-and-summarize/route.ts` (line 55)

**Issue:** Next.js 15 changed how route parameters are accessed - they're now Promises
**Fix:** Update parameter destructuring to await params
```typescript
// Before:
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const noteId = parseInt(params.id);
    // ...
}

// After:
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const noteId = parseInt(id);
    // ...
}
```

### 2.2 Auth Handler Export Pattern
**File:** `src/app/auth/[...all]/route.ts`
**Issue:** Incorrect export pattern for Next.js 15
**Fix:** Update to
```typescript
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;
```

## 3. TypeScript Compilation Errors

### 3.1 User ID Type Mismatches
**Files:**
- `src/app/api/notes/route.ts` (lines 37, 46, 95)
- `src/app/api/notes/[id]/route.ts` (lines 33, 71)

**Issue:** Database uses integer IDs but auth session provides string IDs
**Fix:** Ensure consistent type handling
```typescript
// Before:
parseInt(session.user.id)

// After: Keep parseInt but ensure session.user.id exists
parseInt(session.user.id || '0')
```

### 3.2 Missing Type Definitions
**File:** `src/components/AuthProvider.tsx`
**Issue:** Empty implementation with syntax error (line 11)
**Fix:** Implement proper AuthProvider
```typescript
'use client';

import { AuthProvider as BetterAuthProvider } from 'better-auth/react';
import { auth } from '@/lib/auth';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    return (
        <BetterAuthProvider>
            {children}
        </BetterAuthProvider>
    );
}
```

## 4. Deprecated TanStack Query Options

### 4.1 keepPreviousData Option
**File:** `src/hooks/useNotes.ts` (line 36)
**Issue:** `keepPreviousData` is deprecated in v5
**Fix:** Replace with `placeholderData`
```typescript
// Before:
keepPreviousData: true,

// After:
placeholderData: (previousData) => previousData,
```

## 5. ESLint Configuration Issues

### 5.1 Incorrect Import Path
**File:** `eslint.config.mjs` (line 1)
**Issue:** Incorrect import path for ESLint config
**Fix:** Update import
```javascript
// Before:
import { defineConfig, globalIgnores } from "eslint/config";

// After:
import { defineConfig } from "eslint/config";
import { globalIgnores } from "@eslint/config-helpers";
```

## 6. Code Quality Issues

### 6.1 Mixed Import Styles
**File:** `src/app/api/transcribe-and-summarize/route.ts` (line 55)
**Issue:** Using require() instead of ES6 import
**Fix:** Replace require with import
```typescript
// Before:
file: require('fs').createReadStream(tempPath),

// After:
import { createReadStream } from 'fs';
// Then use:
file: createReadStream(tempPath),
```

### 6.2 Unused Imports
**Files:** Multiple files have unused imports
**Fix:** Remove unused imports from:
- `src/app/api/transcribe-and-summarize/route.ts` (line 1: fs import)
- Other files as identified during linting

## 7. Security Vulnerabilities

### 7.1 Environment Variable Exposure
**File:** `.env.local` (if exists)
**Issue:** Potential exposure of sensitive environment variables with NEXT_PUBLIC prefix
**Fix:** Ensure only non-sensitive variables use NEXT_PUBLIC prefix

### 7.2 File Upload Validation
**File:** `src/app/api/transcribe-and-summarize/route.ts`
**Issue:** Missing file size validation
**Fix:** Add file size limit
```typescript
// Add after line 42:
// Validate file size (max 25MB)
const maxSize = 25 * 1024 * 1024; // 25MB in bytes
if (file.size > maxSize) {
    return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
    );
}
```

## 8. Configuration Issues

### 8.1 Missing Tailwind Config
**Issue:** No `tailwind.config.ts` file found
**Fix:** Create Tailwind config file
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

## 9. Integration Issues

### 9.1 AuthProvider Implementation
**File:** `src/components/AuthProvider.tsx`
**Issue:** Empty implementation not providing auth context
**Fix:** Implement proper provider (see section 3.2)

### 9.2 VoiceRecorder Component
**File:** `src/components/VoiceRecorder.tsx`
**Issue:** Missing error handling for audio blob conversion
**Fix:** Add proper error handling
```typescript
// Add after line 31:
if (!audioBlob || audioBlob.size === 0) {
    throw new Error('Failed to create audio blob');
}
```

## Implementation Priority

1. **Critical (Blocks Build):**
   - Fix missing dependencies (openai package)
   - Fix Next.js 15 API route parameter handling
   - Fix auth handler export pattern

2. **High (Blocks Functionality):**
   - Implement proper AuthProvider
   - Fix user ID type mismatches
   - Update TanStack Query options

3. **Medium (Code Quality):**
   - Fix ESLint configuration
   - Remove unused imports
   - Replace require() statements

4. **Low (Security & Best Practices):**
   - Add file upload validation
   - Fix environment variable exposure
   - Create missing Tailwind config

## Testing Strategy

After implementing fixes:
1. Run `npm run build` to verify no compilation errors
2. Run `npm run lint` to verify linting issues are resolved
3. Test authentication flow
4. Test note creation and management
5. Test voice recording and transcription
6. Verify all API endpoints work correctly