<img src="icon.png" width="150" alt="WikTok Icon"><br>
# WikTok: 🎥 x 📖

WikTok is a video platform that combines the addictive scrolling experience of TikTok with educational Wikipedia content. It's a fun way to learn random facts while watching short videos!

<img src="demo.gif" width="300" alt="WikTok Demo"><br>

## Try it out: [wiktok.lol](https://wiktok.lol)
The initial loading might take a few seconds as the app needs to generate the first summary.

## How it Works

1. **Random Wikipedia Articles**: The app fetches random Wikipedia articles and uses AI to create engaging, personality-filled summaries in different styles:
   - 4chan greentext style for biographies
   - Reddit storytelling for historical events
   - Tech review style for inventions
   - YouTuber narration style for other topics

2. **Text-to-Speech**: These summaries are converted into natural-sounding speech using Google's Text-to-Speech API.

3. **Video Experience**: The audio narration plays over looping background videos, creating an immersive learning experience similar to TikTok's interface.

4. **Infinite Scroll**: Just like TikTok, you can scroll through an endless feed of educational content.

## Technology Stack

- **Frontend**: React.js with hooks and custom video/audio synchronization
- **Backend**: FastAPI (Python) with async support
- **AI Integration**: DeepSeek-V3 model for text summarization
- **Speech Synthesis**: Google Cloud Text-to-Speech
- **Content Source**: Wikipedia API

## Features

- Vertical video scrolling interface
- AI-powered content summarization
- Professional text-to-speech narration
- Links to full Wikipedia articles
- Mutable audio
- Preloading for smooth transitions
- Mobile-first responsive design

## Project Status

This is a demo project with lots of things to improve.<br>
Feel free to clone it and build harder, better, faster, stronger.


## Credits

Created by [Mike Gvozdev](https://www.linkedin.com/in/mike-gvozdev/)

Background videos:
- [Minecraft](https://www.youtube.com/watch?v=NX-i0IWl3yg&t)
- [Subway Surfers](https://www.youtube.com/watch?v=i0M4ARe9v0Y)

Music: [Suno](https://suno.com/)


## License

MIT License