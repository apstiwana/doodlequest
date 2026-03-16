
## The Problem

The current approach asks Gemini's image generation model to **recreate** the drawing as a new sprite. This is unreliable — the model sometimes only returns text, ignores the drawing, or fails silently and falls back to the original unprocessed image. No edge function logs are recorded recently, meaning it's likely failing silently.

The correct solution is a **dedicated background removal API** — a model that takes in an image and outputs the same image with the background made transparent (a proper PNG with alpha channel). This is a fundamentally different task from image generation.

## Best Option: remove.bg

**remove.bg** is the industry standard for this exact task:
- Uploads an image, returns a transparent PNG with the subject perfectly cut out
- Works with hand-drawn characters, photos, illustrations
- Has a generous free tier (50 API calls/month, no credit card needed)
- Simple REST API: POST the image file, receive a PNG binary back
- Takes ~1-2 seconds

**Alternative considered: Hugging Face (RMBG-2.0)** — this model exists but Hugging Face's free Inference API is extremely rate-limited and unreliable for production use. remove.bg is more reliable and purpose-built.

## New Two-Step Pipeline

```text
User uploads drawing
       ↓
Step 1: remove.bg API
  POST image → returns transparent PNG (subject extracted, background gone)
       ↓
Step 2: Gemini vision (describe the character)
  The transparent PNG → text description for AI chat context
       ↓
Return: clean PNG data URI + description
```

The Gemini image *generation* step is removed entirely. The subject is extracted accurately by remove.bg, and Gemini is only used for its reliable text description (which it does well).

## Implementation Plan

### 1. Store the remove.bg API key
Add `REMOVEBG_API_KEY` as a backend secret. The user needs to get a free key from https://www.remove.bg/api — it takes 30 seconds to sign up.

### 2. Update `supabase/functions/remove-background/index.ts`
- Replace the Gemini image generation call with a `fetch` to `https://api.remove.bg/v1.0/removebg`
- Upload the image as `multipart/form-data` with field `image_file`
- Set header `X-Api-Key: ${REMOVEBG_API_KEY}`
- The response is raw PNG binary — convert to base64 data URI
- Keep Gemini vision step for description (it works well)
- Keep original image as fallback if remove.bg fails

### Files to change
- `supabase/functions/remove-background/index.ts` — replace generation with remove.bg call
- No frontend changes needed — the output format is the same (`imageData` base64 URI)

### API call shape (remove.bg)
```
POST https://api.remove.bg/v1.0/removebg
Header: X-Api-Key: <key>
Body: multipart/form-data
  image_file: <binary image>
  size: auto
Response: raw PNG binary (image/png)
```

The result will be a crisp transparent PNG with exactly the drawn subject — no background, no recreation, just clean extraction. In the game, the existing `drop-shadow` CSS filter will make it pop against the scene backgrounds.
