// SHIM: vladmandic/face-api internally requires '@tensorflow/tfjs-node' which is not in our dependencies.
// We shim require to redirect it to '@tensorflow/tfjs' which we have installed.
// This must be done BEFORE any other imports that might trigger the internal require.
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
    if (id === '@tensorflow/tfjs-node') {
        return originalRequire.apply(this, ['@tensorflow/tfjs']);
    }
    return originalRequire.apply(this, arguments);
};

import * as faceapi from '@vladmandic/face-api/dist/face-api.node.js';
import * as canvas from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import { IPlayer } from '../models/Player';

// Monkey patch face-api for Node.js using napi-rs/canvas
const { Canvas, Image, ImageData } = canvas;

// Important: do this as early as possible
faceapi.env.monkeyPatch({
    Canvas: Canvas as any,
    Image: Image as any,
    ImageData: ImageData as any,
    createCanvasElement: (w?: number, h?: number) => canvas.createCanvas(w || 1, h || 1) as any,
    createImageElement: () => new Image() as any,
});

// Configure backend using faceapi's own tf instance
const tf = faceapi.tf;

let modelsLoaded = false;

export async function loadFaceModels() {
    if (modelsLoaded) return;

    try {
        // Explicitly set Node environment if it wasn't detected
        if (!faceapi.env.isNodejs()) {
            console.warn('DEBUG: Forcing Nodejs environment detection');
            const env = faceapi.env as any;
            if (env.setEnv && env.createNodejsEnv) {
                env.setEnv(env.createNodejsEnv());
            }
        }

        console.log(`DEBUG: faceapi.env.isNodejs(): ${faceapi.env.isNodejs()}`);

        const modelsPath = path.resolve(process.cwd(), 'public', 'face-models');
        console.log(`DEBUG: Target models path: ${modelsPath}`);

        if (!fs.existsSync(modelsPath)) {
            // Try fallback path relative to this file
            const fallbackPath = path.resolve(__dirname, '../../public/face-models');
            console.log(`DEBUG: CWD path failed, trying fallback: ${fallbackPath}`);
            if (!fs.existsSync(fallbackPath)) {
                throw new Error(`Models directory not found at ${modelsPath} or ${fallbackPath}`);
            }
            await loadFromPath(fallbackPath);
        } else {
            await loadFromPath(modelsPath);
        }
    } catch (error: any) {
        console.error('❌ Failed to load face models:', error.message || error);
        if (error.stack) console.error(error.stack);
        throw new Error(`Facial recognition initialization failed: ${error.message}`);
    }
}

async function loadFromPath(modelsPath: string) {
    console.log(`Loading face-api models from: ${modelsPath}`);

    // Ensure tf backend is ready
    await (tf as any).setBackend('cpu');
    await (tf as any).ready();
    console.log(`DEBUG: TF Backend: ${(tf as any).getBackend()}`);

    // Load models one by one with explicit checks
    const nets = faceapi.nets as any;

    console.log(' - Loading ssdMobilenetv1...');
    await nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    console.log(' - Loaded ssdMobilenetv1');

    console.log(' - Loading faceLandmark68Net...');
    await nets.faceLandmark68Net.loadFromDisk(modelsPath);
    console.log(' - Loaded faceLandmark68Net');

    console.log(' - Loading faceRecognitionNet...');
    await nets.faceRecognitionNet.loadFromDisk(modelsPath);
    console.log(' - Loaded faceRecognitionNet');

    modelsLoaded = true;
    console.log('✅ All face models loaded successfully');
}

export async function detectFaceDescriptor(imagePath: string): Promise<Float32Array | null> {
    await loadFaceModels();

    let img;
    try {
        if (imagePath.startsWith('http')) {
            // Handle remote URL (e.g., Cloudinary)
            console.log(`DEBUG: Fetching remote image for face detection: ${imagePath}`);
            const response = await fetch(imagePath);
            if (!response.ok) {
                console.error(`DEBUG: Failed to fetch remote image: ${response.status} ${response.statusText}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            img = await canvas.loadImage(buffer);
            console.log(`DEBUG: Remote image loaded successfully. Dimensions: ${img.width}x${img.height}`);
        } else {
            // Handle local path
            if (!fs.existsSync(imagePath)) {
                console.error(`DEBUG: Image not found at path: ${imagePath}`);
                return null;
            }
            img = await canvas.loadImage(imagePath);
            console.log(`DEBUG: Local image loaded successfully. Dimensions: ${img.width}x${img.height}`);
        }

        if (!img.width || !img.height) {
            console.error('DEBUG: Image dimensions are invalid.');
            return null;
        }

        // Detect single face and extract the 128-float descriptor (the "face fingerprint")
        const detection = await faceapi
            .detectSingleFace(img as any)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            console.log(`DEBUG: No face detected in image: ${imagePath}`);
        } else {
            console.log(`DEBUG: Face detected successfully in image: ${imagePath}`);
        }

        return detection ? detection.descriptor : null;
    } catch (error) {
        console.error('Error in face detection:', error);
        return null;
    }
}

export function isDuplicateFace(newDescriptor: Float32Array | number[], existingPlayers: IPlayer[], threshold: number = 0.45): boolean {
    // Standardizing the input
    const newDesc = new Float32Array(newDescriptor);

    for (const player of existingPlayers) {
        if (!player.faceDescriptor || player.faceDescriptor.length === 0) continue;

        const storedDesc = new Float32Array(player.faceDescriptor);

        // Euclidean distance: 0 is an exact match, > 0.6 is usually a different person
        const distance = faceapi.euclideanDistance(storedDesc, newDesc);

        console.log(`Distance to ${player.firstName}: ${distance.toFixed(4)}`);

        if (distance < threshold) {
            return true;
        }
    }

    return false;
}

/**
 * Performs background face verification for a player.
 * 1. Detects face descriptor from passport photograph.
 * 2. Checks for duplicates in the database.
 * 3. Updates player status to 'Verified' or 'Rejected'.
 */
export async function runAsyncFaceVerification(player: IPlayer) {
    console.log(`[Background Verification] Starting for player: ${player.firstName} ${player.surname} (${player._id})`);
    
    try {
        if (!player.passportPhotographUrl) {
            console.log('[Background Verification] No passport photograph found. Skipping.');
            return;
        }

        const descriptor = await detectFaceDescriptor(player.passportPhotographUrl);

        if (!descriptor) {
            console.log('[Background Verification] No clear face detected. Keeping status as Pending.');
            return;
        }

        // Fetch all OTHER players who have a faceDescriptor
        const { Player } = require('../models/Player');
        const existingPlayers = await Player.find({ 
            _id: { $ne: player._id },
            faceDescriptor: { $exists: true, $not: { $size: 0 } } 
        });

        if (isDuplicateFace(descriptor, existingPlayers)) {
            console.log('[Background Verification] Duplicate face detected! Marking as Rejected.');
            player.status = 'Rejected';
            player.remarks = 'System auto-rejection: Duplicate face detected in registration.';
        } else {
            console.log('[Background Verification] Face is unique. Marking as Verified.');
            player.status = 'Verified';
        }

        // Store the descriptor
        player.faceDescriptor = Array.from(descriptor);
        await player.save();
        
        console.log(`[Background Verification] Completed for ${player.firstName}. Final status: ${player.status}`);
    } catch (error) {
        console.error('[Background Verification] Error during processing:', error);
    }
}