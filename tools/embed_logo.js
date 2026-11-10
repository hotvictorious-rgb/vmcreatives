const fs = require('fs');
const path = require('path');

const logoPath = path.resolve('c:/Users/USER/Downloads/vmcreatives/vm_logo.png');
const htmlPath = path.resolve('c:/Users/USER/Downloads/vmcreatives/outro_generator.html');

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const dataUri = `data:image/png;base64,${logoBase64}`;

let html = fs.readFileSync(htmlPath, 'utf8');

// Replace logoImg.src = 'vm_logo.png'; with the base64 data URI
html = html.replace("logoImg.src = 'vm_logo.png';", `logoImg.src = "${dataUri}";`);

// Add automatic download logic if ?auto=1 or button clicked
fs.writeFileSync(htmlPath, html);
console.log('Successfully embedded base64 logo into outro_generator.html');

