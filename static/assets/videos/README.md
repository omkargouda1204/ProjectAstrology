# 🎬 Videos Folder

Add your website videos here.

## Required Videos:

### Hero Background Video
- `hero-video.mp4` — Background video for hero section
  - **Recommended dimensions:** 1920x1080px (Full HD)
  - **Max duration:** 10-30 seconds (looped)
  - **Max file size:** 10MB (important for fast loading!)
  - **Theme:** Cosmic, stars, galaxy, mystical

### Optional Videos
- `intro.mp4` — Short introduction video for about section
  - **Recommended dimensions:** 1280x720px (HD)
  - **Duration:** 30-60 seconds
  - **Max file size:** 15MB

---

## Video Guidelines

### File Format
- **MP4** — Best compatibility across all browsers
- **WebM** — Alternative format (smaller size, good for web)

### Compression
- Videos MUST be compressed before use
- Target bitrate: 1000-2000 kbps for hero videos
- Use H.264 codec for best compatibility

### Optimization Tips
1. **Reduce resolution** — 1080p is enough, no need for 4K
2. **Shorten duration** — 10-15 seconds is ideal for looping background
3. **Lower framerate** — 24 fps is sufficient for background videos
4. **Remove audio** — Background videos don't need sound (saves space)

---

## Free Stock Video Resources

If you need videos:
- [Pexels Videos](https://www.pexels.com/videos/) — Free stock videos
- [Pixabay Videos](https://pixabay.com/videos/) — Free HD videos
- [Coverr](https://coverr.co/) — Beautiful free stock video footage
- [Videvo](https://www.videvo.net/) — Free stock footage

**Search terms:** "space", "stars", "galaxy", "cosmic", "nebula", "constellation", "night sky"

---

## Video Compression Tools

Use these to compress your videos:

### Online Tools
- [Clipchamp](https://clipchamp.com/) — Online video editor & compressor
- [FreeConvert](https://www.freeconvert.com/video-compressor) — Free video compression
- [CloudConvert](https://cloudconvert.com/mp4-converter) — Convert & compress

### Desktop Software
- **HandBrake** (Free) — Powerful video converter
- **FFmpeg** (Free, command-line) — Professional video processing

### Recommended HandBrake Settings
```
Format: MP4
Video Codec: H.264
Quality: RF 23-25
Framerate: 24 fps
Resolution: 1920x1080 or 1280x720
Audio: None (or AAC 128kbps if needed)
```

---

## Implementation Tips

### HTML5 Video Tag
```html
<video autoplay muted loop playsinline class="hero-video">
    <source src="../assets/videos/hero-video.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>
```

### Performance Best Practices
1. **Use poster image** — Show image while video loads
2. **Lazy load** — Don't load video on mobile (use image instead)
3. **Preload metadata** — Load video info, not full video immediately
4. **Mute by default** — Autoplay only works with muted videos

---

## Alternative: CSS Background

If video files are too large, use CSS gradient background:

```css
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Add animated stars with CSS/JS */
}
```

---

**Status:** 📂 Folder ready — Add your videos here!

**Tip:** Start without videos and add them later if needed. Static images load faster!
