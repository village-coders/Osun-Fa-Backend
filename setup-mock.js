const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, 'node_modules', '@tensorflow', 'tfjs-node');

if (!fs.existsSync(mockPath)) {
    console.log('Creating @tensorflow/tfjs-node mock for production environment...');
    fs.mkdirSync(mockPath, { recursive: true });
    
    const packageJson = {
        name: "@tensorflow/tfjs-node",
        version: "4.22.0",
        main: "index.js"
    };
    
    const indexJs = "module.exports = require('@tensorflow/tfjs-backend-cpu');";
    
    fs.writeFileSync(path.join(mockPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(mockPath, 'index.js'), indexJs);
    console.log('✅ Mock created successfully.');
} else {
    console.log('@tensorflow/tfjs-node already exists, skipping mock creation.');
}
