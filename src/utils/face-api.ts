import '@tensorflow/tfjs-node'; // CRITICAL: Loads the C++ binary engine
import * as faceapi from '@vladmandic/face-api';
import * as canvas from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import { IPlayer } from '../models/Player';

// Monkey patch face-api for Node.js using napi-rs/canvas
// This tells face-api how to "draw" and "read" images without a browser DOM
// Monkey patch face-api for Node.js using napi-rs/canvas
// Standard monkeyPatch can cause crashes if face-api creates a canvas with undefined dimensions
const { Canvas, Image, ImageData } = canvas;

class MockCanvas extends Canvas {
    constructor(width?: number, height?: number) {
        // @napi-rs/canvas crashes if width/height are not numbers
        super(width || 1, height || 1);
    }
}

faceapi.env.monkeyPatch({
    Canvas: MockCanvas as any,
    Image: Image as any,
    ImageData: ImageData as any,
});

let modelsLoaded = false;

export async function loadFaceModels() {
    if (modelsLoaded) return;

    // Ensure this path matches where your .json and .bin files are stored
    const modelsPath = path.resolve(process.cwd(), 'src', 'face-models');

    try {
        console.log(`DEBUG: Attempting to load models from: ${modelsPath}`);
        if (!fs.existsSync(modelsPath)) {
            // Fallback to relative path if cwd-based fails
            const fallbackPath = path.join(__dirname, '..', 'face-models');
            console.log(`DEBUG: CWD path failed, trying fallback: ${fallbackPath}`);
            if (!fs.existsSync(fallbackPath)) {
                throw new Error(`Models directory not found at ${modelsPath} or ${fallbackPath}`);
            }
            // If fallback works, use it
            return await loadFromPath(fallbackPath);
        }
        await loadFromPath(modelsPath);
    } catch (error: any) {
        console.error('❌ Failed to load face models:', error.message || error);
        throw new Error(`Facial recognition initialization failed: ${error.message}`);
    }
}

async function loadFromPath(modelsPath: string) {
    console.log(`Loading face-api models from: ${modelsPath}`);
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath)
    ]);
    modelsLoaded = true;
    console.log('✅ Face models loaded successfully');
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