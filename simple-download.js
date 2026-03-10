const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'src', 'face-models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const baseUrl = 'https://vladmandic.github.io/face-api/model/';
const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function run() {
    for (const f of files) {
        console.log(`Downloading ${f}...`);
        const data = await new Promise((resolve, reject) => {
            https.get(baseUrl + f, res => {
                if (res.statusCode !== 200) return reject(res.statusCode);
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
        });
        fs.writeFileSync(path.join(modelsDir, f), data);
        console.log(`Saved ${f}`);
    }
}

run().catch(console.error);
