const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

const app = express(); // ← This is required

app.use(express.static('public'));

app.get('/download', async (req, res) => {
  const videoURL = req.query.url;
  const quality = req.query.quality || 'highest';

  if (!ytdl.validateURL(videoURL)) {
    return res.status(400).send('Invalid URL');
  }

  const info = await ytdl.getInfo(videoURL);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

  if (quality === 'audio') {
    // MP3 (audio-only)
    const audioFormat = ytdl.chooseFormat(info.formats, {
      filter: 'audioonly',
    });

    if (!audioFormat) return res.status(500).send('No audio format found.');

    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);

    ytdl(videoURL, { format: audioFormat }).pipe(res);
  } else {
    // Video download
    let format;

    if (quality === 'highest') {
      format = ytdl.chooseFormat(info.formats, {
        quality: 'highest',
        filter: (f) => f.container === 'mp4' && f.hasAudio && f.hasVideo
      });
    } else {
      format = ytdl.chooseFormat(info.formats, { quality: quality });
    }

    if (!format) return res.status(500).send('Could not find the selected video quality.');

    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);

    ytdl(videoURL, { format }).pipe(res);
  }
});

app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});

