
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




// await ffmpeg.load();
async function isSetUp(){
    try{
        await ffmpeg.load();
        await ffmpeg.exec(['-version']);
        status_Element.textContent = "I'M ALIVE";
    }catch(e){
        status_Element.textContent = "Init Error: "+ e.message;
    }
}
isSetUp();
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


async function runFFMPEG(filesArray){
    if(!filesArray || filesArray.length === 0){
        alert("Please import folder or multiple files");
        return;
    }
    try {
        status_Element.textContent = `Importing ${filesArray.length} files`;
        
        filesArray.sort((a, b) => a.name.localeCompare(b.name));
        
        // const input = `input_${file.name}`;
        const output = `output.mp4`;

        for(const file of filesArray){
            const arrayBuffer = await file.arrayBuffer(); //imported file -> array buffer
            const uint8Array = new Uint8Array(arrayBuffer);
            await ffmpeg.writeFile(input, uint8Array);
        }
        status_Element.textContent = "Processing video...";

        await ffmpeg.exec(['-framerate', '8', '-i', `${input}/frame-%05d.jpg` , "-c:v", 'libx264', '-pix_fmt', 'yuv420p', output]);

        const outputData = await ffmpeg.readFile(output);

        const blob = new Blob([outputData.buffer], {type: 'video/mp4' });
        const downloadURL = URL.createObjectURL(blob);
        result_Element.innerHTML = `<a href = "${downloadURL}" download="processed_${file.name.split(".")[0]}.mp4"> Download </a>`;
        status_Element.textContent = "Done";
    } catch(error){
        status_Element.textContent = "Error: " + error;
    }
}
dropZone.addEventListener('drop', async (e) => {
    const items = Array.from(e.dataTransfer.items);
    if(!items.length){
        return;
    }
    status_Element.textContent = "Scanning folder";
    const allFiles = [];

    async function scanEntry(entry) {
        if(entry.isFile){
            const file = await new Promise((resolve) => entry.file(resolve));
            if(file.type.startsWith('image/') || file.name.endsWith('.jpg')){
                allFiles.push(file);
            }
        }else if(entry.isDirectory){
            const directoryReader = entry.createReader();
            const entries = await new Promise((resolve)=> directoryReader.readEntries(resolve));
            for(const subEntry of entries){
                await scanEntry(subEntry); // recusive scan subfolder in rare case someone puts a folder in a folder
            }
        }
    }
    for (const item of items){
        const entry = item.webkitGetAsEntry();
        if(entry){
            await scanEntry(entry);
        }
    }
    if(allFiles.length >0){
        runFFMPEG(allFiles);
    }else{
        status_Element.textContent = "no valid images found in folder";
    }
});