// ==UserScript==
// @name         YouTube Music Now Playing (Songs + Videos)
// @namespace    https://currentlylistening-ssmm.onrender.com
// @version      2.0
// @description  Send current song or music video info to backend
// @match        https://music.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    //URL HERE!!!!!!!!!! ->
    const BACKEND_URL = "Your url here";
    let lastSong = null;

    // Get YouTube video ID from URL
    function getVideoId() {
        const url = new URL(window.location.href);
        return url.searchParams.get('v') || null;
    }

    // Get official YouTube thumbnail
    function getYouTubeThumbnail(videoId) {
        if (!videoId) return "";
        // Fallback order: maxres → sd → hq → mq
        const qualities = ["maxresdefault", "sddefault", "hqdefault", "mqdefault"];
        return `https://i.ytimg.com/vi/${videoId}/${qualities[0]}.jpg`;
    }

    // Try to extract the thumbnail using multiple methods
    function getYtMusicThumbnail() {
        let thumb = "";

        // 1️⃣ Normal <img> tag for songs
        const imgEl = document.querySelector('#song-image img');
        if (imgEl?.src && !imgEl.src.includes("data:image/gif")) {
            return imgEl.src;
        }

        // 2️⃣ Background image (used by music videos sometimes)
        const bgEl = document.querySelector('#song-image');
        if (bgEl) {
            const bg = getComputedStyle(bgEl).backgroundImage;
            if (bg && bg.startsWith('url')) {
                const url = bg.slice(5, -2);
                if (!url.includes("data:image/gif")) return url;
            }
        }

        // 3️⃣ <video poster> image
        const videoEl = document.querySelector('video.html5-main-video');
        if (videoEl?.poster && !videoEl.poster.includes("data:image/gif")) {
            return videoEl.poster;
        }

        // 4️⃣ YouTube thumbnail API fallback
        const videoId = getVideoId();
        if (videoId) {
            return getYouTubeThumbnail(videoId);
        }

        // 5️⃣ Any <img> in DOM that looks like a ytimg.com thumbnail
        const allImgs = document.querySelectorAll('img');
        for (const img of allImgs) {
            if (img.src.includes('ytimg.com') && img.width > 100 && !img.src.includes("data:image/gif")) {
                return img.src;
            }
        }

        return thumb;
    }

    // Get current song / music video info
    function getCurrentYtMusicSong() {
        const titleEl = document.querySelector('yt-formatted-string.title.style-scope.ytmusic-player-bar');
        const artistEl = document.querySelector('yt-formatted-string.byline.style-scope.ytmusic-player-bar');

        const title = titleEl?.textContent.trim() || "Unknown title";
        const artist = artistEl?.textContent.trim() || "Unknown artist";
        const thumbnail = getYtMusicThumbnail();

        return { title, artist, thumbnail };
    }

    // Send to backend only when song changes
    async function updateNowPlaying() {
        const song = getCurrentYtMusicSong();

        if (!lastSong || lastSong.title !== song.title || lastSong.artist !== song.artist) {
            try {
                const res = await fetch(BACKEND_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(song)
                });

                if (!res.ok) console.error("❌ Failed to send song:", res.statusText);
                else console.log("✅ Now Playing:", song);

                lastSong = song;
            } catch (err) {
                console.error("⚠️ Error sending song:", err);
            }
        }
    }

    // Use Observer for updates
    function initNowPlayingObserver() {
        const playerBar = document.querySelector('ytmusic-player-bar');
        if (!playerBar) {
            console.warn("ytmusic-player-bar not found yet. Retrying...");
            setTimeout(initNowPlayingObserver, 2000);
            return;
        }

        const observer = new MutationObserver(() => {
            updateNowPlaying();
        });

        observer.observe(playerBar, { childList: true, subtree: true });
        console.log("🎧 NowPlaying observer active");
    }

    initNowPlayingObserver();
})();

