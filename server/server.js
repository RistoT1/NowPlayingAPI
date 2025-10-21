import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies

const FILE = path.join(process.cwd(), "lastSong.json");

// In-memory store for current song
let currentSong = null;
let lastLoggedTitle = null; // Keep track of last logged song title

// Load last song from JSON if it exists
try {
  const data = fs.readFileSync(FILE, "utf-8");
  currentSong = JSON.parse(data);
  lastLoggedTitle = currentSong.title;
} catch (err) {
  currentSong = null;
}

// Save current song to JSON file
function saveSong() {
  if (currentSong) {
    fs.writeFileSync(FILE, JSON.stringify(currentSong, null, 2));
  }
}

// POST endpoint to update current song
app.post("/nowplaying", (req, res) => {
  const { title, artist, thumbnail } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "Invalid song data" });
  }

  // Only update if song changed
  if (!currentSong || currentSong.title !== title) {
    currentSong = { title, artist, thumbnail, updated: Date.now() };
    
    // Log only when song changes
    console.log(JSON.stringify(currentSong, null, 2));

    // Save to JSON
    saveSong();

    // Update last logged title
    lastLoggedTitle = title;
  } else {
    // Update timestamp without logging
    currentSong.updated = Date.now();
    saveSong();
  }

  res.sendStatus(200);
});

// GET endpoint for API (for portfolio or other clients)
app.get("/nowplaying", (req, res) => {
  res.json(
    currentSong || { title: "Nothing playing", artist: "", thumbnail: "" }
  );
});

// GET "/" shows the current song as JSON in browser
app.get("/", (req, res) => {
  res.send(
    `<pre>${JSON.stringify(
      currentSong || { title: "Nothing playing", artist: "", thumbnail: "" },
      null,
      2
    )}</pre>`
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Backend API running on port ${PORT}`)
);
