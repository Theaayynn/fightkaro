# ⚔️ FightKaro Rebuild - Satirical 2D Browser Fighting Game

A fully featured, browser-based 2D fighting game inspired by [fightkaro.com](https://fightkaro.com/). Built with **Phaser 3**, **TypeScript**, **Express**, and **Socket.io**.

---

## 🌟 Features Included

1. **Complete Roster of 5 Satirical Characters:**
   - **MITRAMAN**: High-defense juggernaut, "56-INCH IMPACT" Super.
   - **YATRA BOY**: Agile rushdown fighter with marathon speed, "MOHABBAT THUNDER" Super.
   - **DOZER DADA**: Heavyweight striker with high poise, "BULLDOZER RAMPAGE" Super.
   - **DIDI THUNDER**: Fast counter-strikes and cyclone kicks, "KHELA HOBE CYCLONE" Super.
   - **MUFFLER MAN**: Defensive tactician with projectile whirlwind, "DHARNA WHIRLWIND" Super.

2. **3 Selectable Arenas:**
   - **Jantar Mantar**: Plaza of banners, streetlights, and crowd silhouettes.
   - **Desi Sadak**: Chai stalls, neon boards, and auto-rickshaw backdrop.
   - **Sansad Bhavan**: Grand stone pillars, velvet red carpet, and podium.

3. **Fighting Engine & Mechanics:**
   - Real-time physics, collisions, jump, crouch, and ground bounds.
   - Punch, Kick, Grab (unblockable throw), Special Moves, and 100% Shakti Meter Super Move.
   - Block mechanic (absorbs 75% damage with sound/visual cue).
   - Combo counter with dynamic multipliers and floating announcements.
   - Health bars with animated damage drops and 99s round countdown.

4. **Strategic 3-Tier CPU AI:**
   - **Easy**: Slow reactions, basic punches/kicks.
   - **Normal**: Balanced spacing, combos, and occasional specials.
   - **Hard**: Frame-perfect blocking, aggressive gap-closing, and strategic super moves.

5. **Real-time Online Multiplayer:**
   - Host Room: Generates unique 5-character room code (e.g., `FK789`).
   - Join Room: Opponent joins via code.
   - Full live synchronization of movements, attacks, damage, and rematch requests over WebSockets.

6. **Audio & Mobile Experience:**
   - **Procedural Web Audio Engine**: Zero external asset dependencies (never 404s!).
   - **Mobile Touch Controls**: Responsive on-screen virtual D-Pad and Action Buttons.
   - **Orientation Detector**: Prompts player to rotate device to landscape for full-screen gameplay.

---

## 🚀 How to Deploy (Live Production)

This project has a **unified full-stack architecture**. A single Node.js process serves both the compiled game frontend (`dist/`) and the real-time WebSocket server (`Socket.io`) on the same port!

### Option 1: Deploy to Render (Recommended - Free)
1. Push this folder to a GitHub repository (or upload the files to GitHub).
2. Go to [https://render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` or set these settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **Deploy**. Your game will be live with full multiplayer support!

---

### Option 2: Deploy to Railway
1. Go to [https://railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects `Dockerfile` or `package.json`.
4. Click **Deploy Now**. It will provide a live `*.up.railway.app` URL.

---

### Option 3: Deploy via Docker / Any VPS
A production-ready multi-stage `Dockerfile` is included in the root directory:
```bash
docker build -t fightkaro-game .
docker run -p 3000:3000 fightkaro-game
```

---

## 💻 Local Testing & Development

Make sure you are in the project directory:
```powershell
cd D:\fightkaro-rebuild
```

### Production Build & Test:
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Controls

### Desktop Keyboard:
- **Move Left / Right:** `A` / `D` or `Arrow Keys`
- **Jump:** `W` or `Up Arrow`
- **Crouch:** `S` or `Down Arrow`
- **Punch:** `J`
- **Kick:** `K`
- **Grab / Throw:** `U`
- **Special Attack:** `I` (Requires 25% Shakti)
- **SUPER SHAKTI MOVE:** `O` (Requires 100% Shakti)
- **Block:** `L` (Hold to block)
- **Pause Menu:** `ESC`

### Mobile Devices:
- On-screen touch buttons for D-Pad, Punch, Kick, Grab, Block, and Super.
- Fullscreen button available on the main menu.
