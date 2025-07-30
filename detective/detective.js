const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "sneha-devkota";
const GRID_SIZE = [53, 7]; // Weeks x Days

const COLORS = {
  0: "#ebedf0",
  1: "#9be9a8",
  2: "#40c463",
  3: "#30a14e",
  4: "#216e39",
};

const getContributionData = async () => {
  const res = await fetch(`https://github.com/users/${USERNAME}/contributions`);
  const text = await res.text();
  const regex = /data-count="(\d+)" data-date="([^"]+)" fill="([^"]+)"/g;

  const grid = Array.from({ length: GRID_SIZE[0] }, () => Array(GRID_SIZE[1]).fill(0));

  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    const [_, countStr, date, color] = match;
    const week = Math.floor(i / 7);
    const day = i % 7;
    const count = parseInt(countStr);
    grid[week][day] = count;
    i++;
  }

  return grid;
};

const generatePath = (grid) => {
  let path = [];
  for (let x = 0; x < GRID_SIZE[0]; x++) {
    for (let y = 0; y < GRID_SIZE[1]; y++) {
      if (grid[x][y] > 0) {
        path.push({ x, y });
      }
    }
  }
  return path;
};

const createSVG = (path) => {
  const cellSize = 12;
  const padding = 2;
  const width = cellSize * GRID_SIZE[0];
  const height = cellSize * GRID_SIZE[1];

  const detective = `
    <circle id="detective" cx="${path[0].x * cellSize}" cy="${path[0].y * cellSize}" r="5" fill="black" />
  `;

  const animations = path
    .map((point, i) => {
      const dur = 0.2;
      const begin = `${i * dur}s`;
      return `
        <animate
          xlink:href="#detective"
          attributeName="cx"
          to="${point.x * cellSize}"
          dur="${dur}s"
          begin="${begin}"
          fill="freeze" />
        <animate
          xlink:href="#detective"
          attributeName="cy"
          to="${point.y * cellSize}"
          dur="${dur}s"
          begin="${begin}"
          fill="freeze" />
      `;
    })
    .join("\n");

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      ${detective}
      ${animations}
    </svg>
  `;
};

const main = async () => {
  const grid = await getContributionData();
  const path = generatePath(grid);

  if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
  }

  const svg = createSVG(path);
  fs.writeFileSync("output/detective.svg", svg);
};

main();
