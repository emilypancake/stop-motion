
const { FFmpeg } = window.FFmpegWeb;
const ffmpeg = new FFmpeg();

await ffmpeg.load();

ffmpeg.on("progress", ({ progress, time}) => {
    // update html with progress, time
});
ffmpeg.on("log", ({type, messsage}) => {
    // update html with possible error logs
});

const result = await ffmpeg.exec(['-version']);
//update html with result