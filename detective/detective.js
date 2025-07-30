import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

class DetectiveAnimation {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.username = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'sneha-devkota';
    this.gridWidth = 53; // GitHub's standard week count
    this.gridHeight = 7; // Days of week
    this.cellSize = 11;
    this.cellGap = 3;
    this.totalWidth = this.gridWidth * (this.cellSize + this.cellGap);
    this.totalHeight = this.gridHeight * (this.cellSize + this.cellGap);
  }

  async fetchContributions() {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.octokit.graphql(query, {
        username: this.username
      });

      return response.user.contributionsCollection.contributionCalendar.weeks;
    } catch (error) {
      console.error('Error fetching contributions:', error);
      return this.generateMockData();
    }
  }

  generateMockData() {
    // Fallback mock data for testing
    const weeks = [];
    for (let w = 0; w < this.gridWidth; w++) {
      const days = [];
      for (let d = 0; d < this.gridHeight; d++) {
        days.push({
          contributionCount: Math.floor(Math.random() * 10),
          date: new Date().toISOString().split('T')[0]
        });
      }
      weeks.push({ contributionDays: days });
    }
    return weeks;
  }

  generateDetectiveWalkPath(contributions) {
    const path = [];
    const visited = new Set();
    
    // Start at a random position
    let currentX = Math.floor(Math.random() * this.gridWidth);
    let currentY = Math.floor(Math.random() * this.gridHeight);
    
    // Generate a winding path that visits high-contribution areas more often
    for (let step = 0; step < 200; step++) {
      path.push({ x: currentX, y: currentY, step });
      visited.add(`${currentX},${currentY}`);
      
      // Get neighboring cells
      const neighbors = this.getValidNeighbors(currentX, currentY);
      
      // Prefer moving to high-contribution areas
      const weightedNeighbors = neighbors.map(pos => {
        const contribution = contributions[pos.x]?.contributionDays[pos.y]?.contributionCount || 0;
        const visitBonus = visited.has(`${pos.x},${pos.y}`) ? 0 : 5;
        return { ...pos, weight: contribution + visitBonus + Math.random() * 3 };
      });
      
      // Choose next position based on weights
      weightedNeighbors.sort((a, b) => b.weight - a.weight);
      const next = weightedNeighbors[0] || neighbors[0];
      
      if (next) {
        currentX = next.x;
        currentY = next.y;
      } else {
        // Jump to random position if stuck
        currentX = Math.floor(Math.random() * this.gridWidth);
        currentY = Math.floor(Math.random() * this.gridHeight);
      }
    }
    
    return path;
  }

  getValidNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 1, dy: 1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const { dx, dy } of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < this.gridWidth && newY >= 0 && newY < this.gridHeight) {
        neighbors.push({ x: newX, y: newY });
      }
    }
    
    return neighbors;
  }

  createDetectiveSVG(contributions, walkPath) {
    const animationDuration = 60; // seconds
    const stepDuration = animationDuration / walkPath.length;
    
    let svg = `
<svg width="${this.totalWidth + 100}" height="${this.totalHeight + 100}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .grid-cell { fill: #161b22; stroke: #21262d; stroke-width: 1px; rx: 2; }
      .contribution-1 { fill: #0e4429; }
      .contribution-2 { fill: #006d32; }
      .contribution-3 { fill: #26a641; }
      .contribution-4 { fill: #39d353; }
      
      .detective {
        transform-origin: center;
        animation: detectiveWalk ${animationDuration}s linear infinite;
      }
      
      .detective-body { fill: #8b7355; }
      .detective-coat { fill: #654321; }
      .detective-hat { fill: #2c1810; }
      .detective-magnifier { fill: #c0c0c0; stroke: #8c8c8c; stroke-width: 1; }
      
      .footprint {
        fill: #4a5568;
        opacity: 0;
        animation: footprintFade 3s ease-out;
      }
      
      @keyframes detectiveWalk {
        ${this.generateWalkKeyframes(walkPath)}
      }
      
      @keyframes footprintFade {
        0% { opacity: 0; }
        10% { opacity: 0.8; }
        100% { opacity: 0; }
      }
      
      .magnifier-glow {
        animation: magnifierGlow 4s ease-in-out infinite;
      }
      
      @keyframes magnifierGlow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#0d1117"/>
  
  <!-- Contribution Grid -->
  <g transform="translate(50, 50)">
`;

    // Draw contribution grid
    for (let week = 0; week < this.gridWidth; week++) {
      for (let day = 0; day < this.gridHeight; day++) {
        const x = week * (this.cellSize + this.cellGap);
        const y = day * (this.cellSize + this.cellGap);
        const contribution = contributions[week]?.contributionDays[day]?.contributionCount || 0;
        const level = this.getContributionLevel(contribution);
        
        svg += `    <rect x="${x}" y="${y}" width="${this.cellSize}" height="${this.cellSize}" 
                     class="grid-cell contribution-${level}"/>\n`;
      }
    }

    // Add footprints along the path
    svg += this.generateFootprints(walkPath);

    // Add detective character
    svg += `
    <!-- Detective Character -->
    <g class="detective">
      ${this.createDetectiveCharacter()}
    </g>
  </g>
  
  <!-- Title -->
  <text x="${this.totalWidth / 2 + 50}" y="30" text-anchor="middle" 
        fill="#c9d1d9" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    🕵️ Code Detective on the Trail
  </text>
  
</svg>`;

    return svg;
  }

  getContributionLevel(count) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 9) return 3;
    return 4;
  }

  generateWalkKeyframes(walkPath) {
    let keyframes = '';
    
    walkPath.forEach((pos, index) => {
      const percentage = (index / walkPath.length) * 100;
      const x = pos.x * (this.cellSize + this.cellGap) + this.cellSize / 2;
      const y = pos.y * (this.cellSize + this.cellGap) + this.cellSize / 2;
      
      keyframes += `    ${percentage.toFixed(2)}% { transform: translate(${x}px, ${y}px); }\n`;
    });
    
    return keyframes;
  }

  generateFootprints(walkPath) {
    let footprints = '';
    
    walkPath.forEach((pos, index) => {
      if (index % 3 === 0) { // Every 3rd step leaves a footprint
        const x = pos.x * (this.cellSize + this.cellGap) + this.cellSize / 2;
        const y = pos.y * (this.cellSize + this.cellGap) + this.cellSize / 2;
        const delay = (index / walkPath.length) * 60; // seconds
        
        footprints += `
      <ellipse cx="${x}" cy="${y}" rx="3" ry="5" class="footprint"
               style="animation-delay: ${delay}s;" transform="rotate(${Math.random() * 30 - 15} ${x} ${y})"/>`;
      }
    });
    
    return footprints;
  }

  createDetectiveCharacter() {
    return `
      <!-- Detective Body -->
      <g transform="translate(-8, -15)">
        <!-- Coat -->
        <rect x="2" y="8" width="12" height="16" rx="2" class="detective-coat"/>
        
        <!-- Body -->
        <rect x="4" y="10" width="8" height="12" rx="2" class="detective-body"/>
        
        <!-- Hat -->
        <ellipse cx="8" cy="6" rx="6" ry="3" class="detective-hat"/>
        <rect x="2" y="4" width="12" height="4" rx="1" class="detective-hat"/>
        
        <!-- Magnifying Glass -->
        <g class="magnifier-glow">
          <circle cx="14" cy="12" r="4" class="detective-magnifier" fill="rgba(192,192,192,0.3)"/>
          <circle cx="14" cy="12" r="3" class="detective-magnifier" fill="none"/>
          <line x1="17" y1="15" x2="20" y2="18" class="detective-magnifier"/>
        </g>
        
        <!-- Legs (simple animation) -->
        <rect x="5" y="20" width="2" height="6" rx="1" class="detective-body">
          <animateTransform attributeName="transform" type="rotate"
                          values="0 6 20; 10 6 20; 0 6 20; -10 6 20; 0 6 20"
                          dur="0.8s" repeatCount="indefinite"/>
        </rect>
        <rect x="9" y="20" width="2" height="6" rx="1" class="detective-body">
          <animateTransform attributeName="transform" type="rotate"
                          values="0 10 20; -10 10 20; 0 10 20; 10 10 20; 0 10 20"
                          dur="0.8s" repeatCount="indefinite"/>
        </rect>
      </g>`;
  }

  async generate() {
    console.log('🕵️ Detective is starting investigation...');
    
    try {
      const contributions = await this.fetchContributions();
      console.log('📊 Contribution data collected');
      
      const walkPath = this.generateDetectiveWalkPath(contributions);
      console.log('🚶 Detective path planned');
      
      const svg = this.createDetectiveSVG(contributions, walkPath);
      console.log('🎨 Animation generated');
      
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write SVG file
      const outputPath = path.join(outputDir, 'detective.svg');
      fs.writeFileSync(outputPath, svg);
      
      console.log('✅ Detective animation saved to output/detective.svg');
      
    } catch (error) {
      console.error('❌ Detective investigation failed:', error);
      process.exit(1);
    }
  }
}

// Run the animation generator
const detective = new DetectiveAnimation();
detective.generate();
