
# Doodle Quest 🎨

A full-viewport children's game where a child's uploaded drawing comes to life, explores 5 themed scenes, and holds real AI-powered conversations.

---

## 1. Welcome Screen
- Cute **Fredoka One** title "Doodle Quest" with bouncing star animation (yellow accent)
- Ask for the child's name with a rounded input field
- "Start Adventure!" coral button leads to the upload step

## 2. Drawing Upload Step
- Large dashed drop zone with a friendly icon: "Upload your drawing!"
- On upload, call a **Supabase Edge Function** that sends the image to the **AI background remover** (using Lovable AI with image capabilities) to auto-strip the white paper background
- Show a loading spinner with "Making your drawing magic! ✨"
- Preview the cutout with a tick — child can re-upload if unhappy
- "Let's go!" button launches the game

## 3. The Game Stage (Full Viewport)
### Canvas Layout
- Full-screen illustrated background that changes per scene
- Horizontal **ground line** at the bottom (~80% height), styled per scene:
  - 🌲 Forest — grassy ground with trees
  - 🌊 Underwater — sandy seabed with bubbles
  - 🏙️ City — sidewalk with buildings
  - 🌙 Moon — cratered grey surface
  - 🚀 Space — starfield with floating rocks
- Child's drawing displayed as a **sprite** on the ground

### Character Movement & Animation
- **Arrow keys**: left/right move the character; up/space = jump
- **Bouncy squash-and-stretch physics**: character squishes on landing, stretches on jump takeoff, leans when running
- Character stays within screen bounds, wraps at edges for fun exploration

### Scene Selector
- Floating pill selector at the top showing 5 scene icons
- Clicking a scene plays a **page-turn transition** and character resets to center
- Character auto-says a scene-specific greeting on arrival

## 4. Character Dialogue System
### Speech Bubbles
- Cartoon speech bubble renders above the character
- Bubble fades in/out with a bouncy pop animation
- Text appears word-by-word for a "typing" feel

### Voice Read-Aloud
- Connect **ElevenLabs TTS** to read each bubble aloud in a warm, friendly voice (Sarah or Matilda voice)
- Volume control icon in the corner to mute

### AI-Powered Conversation (Lovable AI)
- Pressing **"T" key** or tapping the speech bubble icon opens a small floating chat input
- Messages sent to a Supabase Edge Function using **Lovable AI** (`google/gemini-3-flash-preview`)
- System prompt instructs the character to:
  - Know the child's name
  - Stay in character as the child's drawing
  - Be aware of the current scene
  - Use age-appropriate, playful language
- Response text shown in speech bubble + read aloud

### Auto-Triggers
- **Scene change**: character says a scene-specific line
- **Idle (5 seconds)**: character says something encouraging
- **Landing from a big jump**: character reacts with excitement
- **Reaching screen edge**: character comments on "exploring"

## 5. UI Overlay (Minimal, Corner-Based)
- 🔇 Mute button — top right
- 💬 Talk button — bottom right (triggers AI chat)
- ⬆️⬇️⬅️➡️ Subtle on-screen arrow pads — bottom center (for mobile support)
- Scene selector strip — top center

## 6. Design System
- Fonts: **Fredoka One** (headings) + **Quicksand** (body) via Google Fonts
- Colors: Coral `#FF6B6B`, Teal `#4ECDC4`, Cloud `#F7F9FC`, Charcoal `#2D3436`, Yellow `#FFE66D`
- All corners rounded, soft drop shadows, no harsh edges
- Bouncy `ease-in-out` CSS animations throughout

## Technical Stack
- **Lovable Cloud** for backend (Edge Functions)
- **Lovable AI** for background removal + character dialogue (`google/gemini-3-flash-preview`)
- **ElevenLabs** connector for text-to-speech read-aloud
- No database needed (fresh each visit)
