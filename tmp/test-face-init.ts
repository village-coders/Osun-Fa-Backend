// SHIM: Redirect @tensorflow/tfjs-node to @tensorflow/tfjs
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === '@tensorflow/tfjs-node') {
        return originalRequire.apply(this, ['@tensorflow/tfjs']);
    }
    return originalRequire.apply(this, arguments);
};

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node.js';
import * as canvas from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import https from 'https';

let logContent = '';
function log(msg: string) {
    console.log(msg);
    logContent += msg + '\n';
}

function fetchImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks: any[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function testDetection() {
    log('Testing face-api detection to reproduce canvas error...');
    
    try {
        await (tf as any).setBackend('cpu');
        await (tf as any).ready();
        log(`tf backend: ${(tf as any).getBackend()}`);

        const { Canvas, Image, ImageData } = canvas;
        
        // Potential fix included in this monkeypatch
        faceapi.env.monkeyPatch({
            Canvas: Canvas as any,
            Image: Image as any,
            ImageData: ImageData as any,
            createCanvasElement: (w?: number, h?: number) => {
                // The error likely comes from w or h being undefined
                const width = w || 1;
                const height = h || 1;
                log(`DEBUG: createCanvasElement called with ${w}x${h} -> using ${width}x${height}`);
                return canvas.createCanvas(width, height) as any;
            },
            createImageElement: () => new Image() as any
        });

        const modelsPath = path.resolve(process.cwd(), 'public', 'face-models');
        log(`Loading models from: ${modelsPath}`);

        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        log('✅ Models loaded.');

        const imagePath = path.resolve(process.cwd(), '../frontend/public/bg-image.png');
        log(`Loading local image: ${imagePath}`);
        
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Test image not found at ${imagePath}`);
        }
        
        const img = await canvas.loadImage(imagePath);
        log(`Image loaded: ${img.width}x${img.height}`);

        log('Starting face detection...');
        const detection = await faceapi
            .detectSingleFace(img as any)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            log('✅ Face detected successfully!');
            log(`Descriptor length: ${detection.descriptor.length}`);
        } else {
            log('❓ No face detected.');
        }

    } catch (error: any) {
        log('❌ Detection failed:');
        log(error.message || error);
        if (error.stack) log(error.stack);
    } finally {
        fs.writeFileSync(path.resolve(process.cwd(), 'tmp/test-results.log'), logContent);
    }
}

testDetection();
