
const { FFmpeg } = window.FFmpegWeb;
const ffmpeg = new FFmpeg();

let progress_Element = document.getElementById('progress');
let time_Element = document.getElementById('time');
let type_Element = document.getElementById('type');
let message_Element = document.getElementById('message');
let result_Element = document.getElementById('result');
let status_Element = document.getElementById('status');

const dropZone = document.getElementById('drop-zone');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {e.preventDefault(); e.stopPropagation();}, false);
});




await ffmpeg.load();

ffmpeg.on("progress", ({ progress, time}) => {
    // update html with progress, time
    progress_Element.textContent = "Progress: " + progress;
    time_Element.textContent = "Time: " + time;

});
ffmpeg.on("log", ({type, message}) => {
    // update html with possible error logs
    type_Element.textContent = "Type: " + type;
    message_Element.textContent = "Message: " + message;
});

const result = await ffmpeg.exec(['-version']);
async function runFFMPEG(file){
    if(!file){
        alert("Please import file");
        return;
    }
    try {
        status_Element.textContent = "Importing your file...";
        const input = `input_${file.name}`;
        const output = `output.mp4`;

        const arrayBuffer = await file.arrayBuffer(); //imported file -> array buffer
        const uint8Array = new Uint8Array(arrayBuffer);

        await ffmpeg.writeFile(input, uint8Array);
        status_Element.textContent = "Processing...";

        await ffmpeg.exec(['-framerate 8', '-i', input + "/frame-%05d.jpg" , "-c:v", 'libx264', '-pix_fmt', 'yuv420p', output]);

        const outputData = await ffmpeg.readFile(output);

        const blob = new Blob([outputData.buffer], {type: 'video/mp4' });
        const downloadURL = URL.createObjectURL(blob);
        result_Element.innerHTML = `<a href = "${downloadURL}" download="processed_${file.name.split(".")[0]}.mp4"> Download </a>`;
        status_Element.textContent = "Done";
    } catch(error){
        status_Element.textContent = "Error: " + error;
    }
}
dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if(files.length > 0){
        runFFMPEG(files[0]);
    }
});