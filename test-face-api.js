try {
    console.log('Attempting to load @vladmandic/face-api...');
    const faceapi = require('@vladmandic/face-api');
    console.log('Loaded face-api successfully');

    console.log('Attempting to load @napi-rs/canvas...');
    const canvas = require('@napi-rs/canvas');
    console.log('Loaded canvas successfully');

    console.log('Monkey patching...');
    faceapi.env.monkeyPatch({
        Canvas: canvas.Canvas,
        Image: canvas.Image,
        ImageData: canvas.ImageData,
    });
    console.log('Monkey patch successful');

    process.exit(0);
} catch (err) {
    console.error('FAILED TO LOAD:');
    console.error(err);
    process.exit(1);
}
