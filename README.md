# 🚇 Subway Runner

A high-octane 3D endless runner game inspired by Subway Surfers, built with **Three.js** and **Vite**. Experience fast-paced action across multiple world themes with dynamic gameplay mechanics.

## ✨ Features

### 🎮 Core Gameplay
- **Endless Running**: Navigate through subway tracks with increasing difficulty
- **Three Lanes**: Move left, right, or stay center to dodge obstacles
- **Procedurally Generated Tracks**: Infinite variety with dynamic obstacle placement
- **Speed Tiers**: 4 difficulty levels (Normal → Fast → Very Fast → Extreme)

### 🎨 Visual Experience
- **Modern Glass UI**: Bioluminescent neon aesthetic with OLED-optimized colors
- **Multiple World Themes**: 
  - 🌃 City (Blue neon)
  - 🎌 Tokyo (Magenta punk)
  - 🗼 Paris (Golden elegance)
- **Real-time Lighting**: Three.js PBR materials with dynamic shadows
- **Particle Effects**: Coin floats, power-up rings, screen flashes

### 👥 Playable Characters
- **Jake** (Default) - Balanced stats
- **Tricky** - Fast lane switching (requires tokens)
- **Fresh** - Extended magnet range (requires tokens)

### ⚡ Power-ups
- 🧲 **Magnet** (10s) - Auto-collect nearby coins
- 🚀 **Jetpack** (8s) - Temporary flight over obstacles
- 👟 **Sneakers** (10s) - 2× speed and jump height
- ⭐ **2× Score** (15s) - Double all points earned

### 🎯 Mission System
- Daily missions with rotating objectives
- Earn mission multiplier bonuses (×1.5, ×2, ×3)
- Coin rewards locked behind mission completion
- Track 3 missions simultaneously

### 📊 Progression
- **High Score Tracking** with local persistence
- **Coin Collection** system (currency for unlocks)
- **Multiplier Levels** for score boosts
- **Hoverboard Powerups** (limited use, 3 default)

### 🎵 Accessibility
- Reduce Motion toggle for accessibility
- Performance-optimized for 60+ FPS

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ and **npm** 8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Navigate to project directory**
   ```bash
   cd "C:\Users\Lenovo\OneDrive\Desktop\2D"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Vite auto-opens at `http://localhost:3000`
   - Or manually navigate to that URL

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🎮 Game Controls

| Action | Controls |
|--------|----------|
| **Move Left** | ← Arrow / A |
| **Move Right** | → Arrow / D |
| **Jump** | Space / W |
| **Roll** | Shift / S |
| **Switch Character** | Q (if card click available) |
| **Pause** | ESC |

---

## 📁 Project Structure

```
2D/
├── index.html              # Main HTML entry point
├── main.js                 # Game logic & Three.js scene
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies & scripts
├── package-lock.json       # Locked dependency versions
└── README.md               # This file
```

### Key Game Systems in `main.js`

- **Game Data**: Character definitions, themes, missions, power-ups
- **Save System**: Local storage persistence (localStorage)
- **Geometry Builders**: Reusable Three.js mesh factories
- **Camera & Rendering**: Dynamic camera follow with shake effects
- **HUD System**: Real-time score, mission display, power-up rings
- **Audio**: Sound effects for collisions, powerups, coin collection

---

## 📦 Dependencies

### Core Dependencies
- **three** (^0.160.0) - 3D graphics library
- **vite** (^5.0.0) - Build tool & dev server

### What They Do
- **Three.js**: Renders 3D environments, meshes, materials, lighting
- **Vite**: Hot module replacement (HMR), instant dev feedback, optimized builds

---

## 🎨 Design System

### Color Tokens (2026 Bioluminescent theme)
```css
--c-fuchsia:  #FF006E   /* Primary action color */
--c-cyan:     #00F5FF   /* Secondary highlight */
--c-toxic:    #CCFF00   /* Success/positives */
--c-gold:     #FFD700   /* Premium/rare */
--c-danger:   #FF3333   /* Warnings/hazards */
```

### Glass UI Components
- Frosted glass effect with 14px blur
- 9% white gradient background (top-left light source)
- 12% white border for definition
- Works seamlessly over animated ambient orbs

---

## 💾 Save Data Format

Stored in browser's `localStorage` under key `subwayRunner2026`:

```js
{
  highScore: 25000,
  totalCoins: 500,
  multiplierLevel: 2,
  selectedChar: "jake",
  selectedTheme: "city",
  hoverboards: 2,
  missionSet: [...],
  missionProgress: [0, 50, 0],
  wordHuntLetters: [],
  reduceMotion: false
}
```

---

## 🐛 Troubleshooting

### Game won't start
- Clear browser cache (Ctrl+Shift+Del)
- Check browser console for errors (F12)
- Ensure JavaScript is enabled

### Low frame rate
- Enable "Reduce Motion" in settings
- Close other browser tabs
- Update graphics drivers
- Try a different browser

### Controls not responding
- Click on the game canvas first to focus it
- Ensure keyboard input is not blocked by browser

---

## 🔧 Development

### Modify Game Settings
Edit constants in `main.js`:
- `LANE_WIDTH` - Adjust lane spacing
- `TRACK_SEG_LEN` - Change track segment length
- `SPEED_TIERS` - Customize difficulty curve

### Add New Themes
Update the `THEMES` array with new color schemes:
```js
const THEMES = [
  {
    id: 'yourtheme',
    name: 'YOUR THEME',
    skyBot: 0x000000,
    // ... other color tokens
  }
];
```

### Create New Characters
Extend the `CHARACTERS` array:
```js
const CHARACTERS = [
  // ... existing chars
  {
    id: 'newchar',
    name: 'New Character',
    color: 0xFF0000,
    // ... other properties
  }
];
```

---

## 📱 Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Mobile Chrome | ✅ Touch controls |

---

## 📄 License

This project is for educational and personal use.

---

## 🎯 Future Enhancements

- [ ] Multiplayer leaderboards
- [ ] Custom control binding
- [ ] Sound effects & music system
- [ ] Achievements/badges
- [ ] More character customization
- [ ] Seasonal events & rewards
- [ ] Mobile app version (React Native)

---

## 🤝 Contributing

Found a bug? Have a feature idea?
- Report issues with detailed reproduction steps
- Include browser and OS information
- Provide screenshots/videos for visual bugs

---

## 📞 Support

For technical questions or issues, check:
1. Browser console (F12) for error messages
2. This README for troubleshooting steps
3. Three.js documentation: https://threejs.org/docs/

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Created with**: Three.js + Vite ⚡
