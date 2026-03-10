const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'src', 'face-models');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// Using JSDelivr CDN for reliable downloads
const baseUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const filesToDownload = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function downloadAll() {
    console.log('Starting download from CDN...');
    for (const file of filesToDownload) {
        const url = baseUrl + file;
        const dest = path.join(modelsDir, file);
        process.stdout.write(`Downloading ${file}... `);
        try {
            await downloadFile(url, dest);
            console.log('Done');
        } catch (err) {
            console.error(`\nError downloading ${file}: ${err.message}`);
        }
    }
    console.log('All downloads finished.');
}

downloadAll();
