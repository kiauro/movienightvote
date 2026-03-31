# 🎬 CineVote

A clean, single-page movie voting app. Add movies, share the link, and let each voter pick their **top 3** — ranked by preference. Results update live with a weighted scoring system.

---

## ✨ Features

- **Admin view** — add/remove movies before voting opens
- **Voter view** — each person selects their top 3 (ranked 1st / 2nd / 3rd)
- **Results view** — weighted leaderboard (1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt) with individual vote log
- **Persisted locally** — all data saved in `localStorage` (no backend needed)
- **Fully responsive** — works on desktop and mobile

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/your-username/movie-vote.git
cd movie-vote

# Open directly in browser (no build step needed)
open index.html
```

Or just drag `index.html` into your browser.

---

## 📁 File Structure

```
movie-vote/
├── index.html   # App shell & all panels
├── style.css    # Cinematic dark theme
├── app.js       # All app logic
└── README.md
```

---

## 🗳️ How It Works

| Role   | Steps |
|--------|-------|
| Admin  | 1. Add movies &nbsp; 2. Click **Open Voting** |
| Voter  | 1. Enter your name &nbsp; 2. Click movies to rank them (1st → 2nd → 3rd) &nbsp; 3. Submit |
| Anyone | View **Results** anytime |

### Scoring

| Pick position | Points |
|---------------|--------|
| 1st choice    | 3 pts  |
| 2nd choice    | 2 pts  |
| 3rd choice    | 1 pt   |

---

## 🌐 Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Your app is live at `https://your-username.github.io/movie-vote`

> **Note:** Each visitor has their own `localStorage`, so votes are per-browser.  
> For shared/persistent voting across devices, consider a small backend (Supabase, Firebase, etc.).

---

## 🛠️ Customisation

- **Change scoring weights** — edit the `3 - i` formula in `renderResults()` inside `app.js`
- **Limit movies** — add a `MAX_MOVIES` guard in `addMovie()`
- **Password-protect admin** — wrap the admin panel actions in a simple PIN check

---

## 📄 License

MIT — free to use and modify.
