// detective/detective.js

const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "template.html");
const outputDir = path.join(__dirname, "..", "output");

// Make sure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Read the HTML file
const html = fs.readFileSync(htmlPath, "utf-8");

// Write it into the output directory
fs.writeFileSync(path.join(outputDir, "index.html"), html);

console.log("✅ index.html generated in output/");
