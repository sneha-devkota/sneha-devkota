const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'template.html');
const outputPath = path.join(__dirname, '..', 'output', 'index.html');

// Load HTML template
let template = fs.readFileSync(templatePath, 'utf8');

// Generate animated footprints (random positions)
function generateFootprints(count = 200) {
  let footprints = '';
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 1200);
    const y = Math.floor(Math.random() * 200);
    footprints += `<circle cx="${x}" cy="${y}" r="4" class="footprint"/>`;
  }
  return footprints;
}

// Inject footprints into the template
const withFootprints = template.replace(
  '<!-- The detective footprints will be added dynamically by JS -->',
  generateFootprints()
);

// Ensure output dir exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Save final animated page
fs.writeFileSync(outputPath, withFootprints);
console.log('✅ Animation generated at output/index.html');
