const fs = require('fs');
const path = require('path');

const tfFolder = path.join(__dirname, 'node_modules', '@tensorflow');

if (!fs.existsSync(tfFolder)) {
    fs.mkdirSync(tfFolder, { recursive: true });
}

const mocks = ['tfjs-node'];

mocks.forEach(mockName => {
    const mockPath = path.join(tfFolder, mockName);
    if (!fs.existsSync(mockPath)) {
        console.log(`Creating @tensorflow/${mockName} mock...`);
        fs.mkdirSync(mockPath, { recursive: true });
        
        const packageJson = {
            name: `@tensorflow/${mockName}`,
            version: "4.22.0",
            main: "index.js"
        };
        
        const indexJs = "module.exports = require('@tensorflow/tfjs-backend-cpu');";
        
        fs.writeFileSync(path.join(mockPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        fs.writeFileSync(path.join(mockPath, 'index.js'), indexJs);
        console.log(`✅ @tensorflow/${mockName} mock created successfully.`);
    } else {
        console.log(`@tensorflow/${mockName} already exists, skipping.`);
    }
});
