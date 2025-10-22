let t = 0;
let particles = [];
let currentCurve = .1;
let nextCurve = .2;
let transitionProgress = 0 ;
let colorPalettes = [];
let prevPalettes = [];
let lastChangeTime = 0;
let maxRadius;
let animationSpeed = 0.05;
let fadeFactor = 1;
let param1 = 2;
let param2 = 3;
let minRadius;
let reflectionFlip = true;
let usePlasmaColor = true;
let centralScaling = true;

 let noiseUpdateCounter = 0;
let cachedNoisePoints = [];

let showParticleTrails = true;
let particleTrails = [];
let showCosmicNoise = true;
let showLightRays = true;
let lightRayAngle = 0.2;
let showLensFlares = true;
let lensFlares = [];
let showFractalOverlay = true;
let showVoronoi = true;
let voronoiCells = [];
let showSacredGeometry = true;
let sacredGeometryTimer = 0.5;
let showMorphingGrid = true;
let gridOffset = 0.4 ;
let kaleidoscopeMode = true;
let tunnelEffect = true;
let tunnelDepth = 0.1;
let showRipples = true;
let ripples = [];
let mouseInfluence = false;
let audioReactive = false;
let fft;
let mic;
let audioContext;
let showBloom = true;
let showChromaticAberration = true;
let showFilmGrain = true;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  noFill();
  
  // Initialize color palettes
  for (let p = 0; p < 7; p++) {
    let baseHue = random(360);
    colorPalettes.push([
      baseHue,
      (baseHue + 120) % 360,
      (baseHue + 240) % 360
    ]);
    prevPalettes.push([baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360]);
  }
  
  // Enhanced color palettes
  colorPalettes.push(
    [0, 15, 30],        // Fire: Red, Orange, Yellow
    [30, 45, 60],       // Sun: Warm Yellow, Orange, Amber
    [180, 200, 220],    // Cold: Cyan, Light Blue, Ice Blue
    [270, 300, 330],    // Plasma: Purple, Magenta, Pink
    [120, 150, 180],    // Forest: Green, Teal, Olive
    [60, 90, 120],      // Earth: Brown, Moss, Sage
    [240, 270, 300],    // Cosmic: Deep Blue, Violet, Indigo
    [0, 120, 240],      // Primary: Red, Green, Blue
    [30, 210, 330]      // Neon: Bright Orange, Lime, Fuchsia
  );
  prevPalettes.push(
    [0, 15, 30],        // Fire: Red, Orange, Yellow
    [30, 45, 60],       // Sun: Warm Yellow, Orange, Amber
    [180, 200, 220],    // Cold: Cyan, Light Blue, Ice Blue
    [270, 300, 330],    // Plasma: Purple, Magenta, Pink
    [120, 150, 180],    // Forest: Green, Teal, Olive
    [60, 90, 120],      // Earth: Brown, Moss, Sage
    [240, 270, 300],    // Cosmic: Deep Blue, Violet, Indigo
    [0, 120, 240],      // Primary: Red, Green, Blue
    [30, 210, 330]      // Neon: Bright Orange, Lime, Fuchsia
  );
  
  // Initialize particles
  for (let i = 0; i < 99; i++) {
    particles.push(createParticle());
  }
  
  // Initialize effect systems
  for (let i = 0; i < 44; i++) {
    lensFlares.push(createLensFlare());
    ripples.push({x: 0, y: 0, size: 0, alpha: 0});
  }
  
  maxRadius = min(width, height) * 0.45;
  minRadius = maxRadius * 0.1;
  currentCurve = floor(random(100));
  nextCurve = floor(random(100));
  
  // Audio setup
  if (audioReactive) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT();
    fft.setInput(mic);
  }
}

function createParticle() {
  return {
    pos: createVector(),
    speed: random(0.005, 0.1),
    offset: random(TWO_PI),
    hue: random(360),
    size: random(1, 15),
    life: random(0.2, 2.5),
    birthTime: t,
    shapeType: floor(random(14)),
    pulseOffset: random(TWO_PI),
    tailType: floor(random(8)),
    velocity: createVector(random(-0.7, 0.7), random(-0.7, 0.7)),
    zDepth: random(0.5, 1.5),
    trail: [],
    clusterId: random() < 0.3 ? floor(random(5)) : -1
  };
}

function createLensFlare() {
  return {
    x: random(width),
    y: random(height),
    size: random(15, 60),              // Slightly larger size range for more impact
    brightness: random(60, 100),       // Higher minimum brightness for cooler visuals
    hue: random(360),                  // Random hue for color palette integration
    angle: random(TWO_PI),
    speed: random(0.02, 0.08),         // Faster speed range for dynamic motion
    elements: floor(random(4, 10)),    // More elements for richer flares
    pulseSpeed: random(0.05, 0.2),     // Speed for pulsing effect
    pulseAmplitude: random(0.2, 0.5),  // Amplitude for size variation
    offset: random(-5, 5)              // Slight random offset for organic look
  };
}

function draw() {
  // Dynamic background with pulsing gradient
  drawDynamicBackground();
  
  if (width !== windowWidth || height !== windowHeight) {
    resizeCanvas(windowWidth, windowHeight);
    maxRadius = min(width, height) * 0.45;
    minRadius = maxRadius * 0.1;
  }
  
  // Handle curve transitions
  if (millis() - lastChangeTime > 7000) {
    transitionProgress += 0.001;
    if (transitionProgress >= 1) {
      transitionProgress = 0;
      currentCurve = nextCurve;
      nextCurve = (nextCurve + floor(random(1, 6))) % 100;
      prevPalettes[currentCurve % colorPalettes.length] = [...colorPalettes[currentCurve % colorPalettes.length]];
      randomizePalette(currentCurve);
      lastChangeTime = millis();
      
      // Occasionally trigger special effects
      if (random() < 0.6) triggerSpecialEffect();
    }
  }
  
  // Apply tunnel effect if enabled
  if (tunnelEffect) {
    push();
    translate(width/2, height/2);
    scale(map(tunnelDepth, 0, 100, 1, 0.2));
    tunnelDepth = (tunnelDepth + 0.5) % 100;
  } else {
    translate(width/2, height/2);
  }
  
  let baseScale = min(width, height) / 600;
  scale(baseScale);
  
  // Draw cosmic noise background
  if (showCosmicNoise) drawCosmicNoise();
  
  // Draw main curves with effects
  drawingContext.filter = showBloom ? 'blur(2px)' : 'blur(1px)';
  drawAdditionalCurves();
  
  if (transitionProgress > 0) {
    drawCurveType(currentCurve, 1 - transitionProgress);
    drawCurveType(nextCurve, transitionProgress);
  } else {
    drawCurveType(currentCurve, 1);
  }
  
  drawParametricCurve();
  
  // Draw morphing grid if enabled
  if (showMorphingGrid) drawMorphingGrid();
  
  // Draw sacred geometry if enabled
  if (showSacredGeometry) drawSacredGeometry();
  
  // Draw particles with trails
  drawingContext.filter = showBloom ? 'blur(2px)' : 'blur(1px)';
  drawParticles();
  
  // Draw particle trails if enabled
  if (showParticleTrails) drawParticleTrails();
  
  // Draw light rays if enabled
  if (showLightRays) drawLightRays();
  
  // Draw lens flares if enabled
  if (showLensFlares) drawLensFlares();
  
  // Draw fractal overlay if enabled
  if (showFractalOverlay) drawFractalOverlay();
  
  // Draw voronoi cells if enabled
  if (showVoronoi) drawVoronoiCells();
  
  // Draw ripples if enabled
  if (showRipples) drawRipples();
  
  // Reset drawing context
  drawingContext.filter = 'none';
  if (tunnelEffect) pop();
  
  // Apply post-processing effects
  if (showChromaticAberration) applyChromaticAberration();
  if (showFilmGrain) applyFilmGrain();
  
  t += animationSpeed;
}

function drawDynamicBackground() {
  // Enhanced pulsing effect with faster, more dynamic variation
  let pulse = 0.6 + 0.4 * sin(t * 0.8 + noise(t * 0.1) * 2); // Added noise for organic variation
  let currentPalette = colorPalettes[currentCurve % colorPalettes.length];
  let prevPalette = prevPalettes[currentCurve % colorPalettes.length];
  
  // Dynamic base color with smoother palette transition
  let bgColor = lerpColor(
    color(0, 0, 15), // Slightly brighter base for more vibrancy
    color(
      lerp(prevPalette[0], currentPalette[0], transitionProgress),
      60, // Increased saturation for richer colors
      20 + pulse * 10 // Brightness modulated by pulse
    ),
    pulse * 0.4 // Stronger pulse influence
  );
  
  // Enhanced color bleed effect with particle influence
  if (particles.length > 0) {
    let avgHue = 0;
    let avgBrightness = 0;
    for (let p of particles) {
      avgHue += p.hue;
      avgBrightness += p.brightness || 66; // Fallback brightness if undefined
    }
    avgHue /= particles.length;
    avgBrightness /= particles.length;
    bgColor = lerpColor(
      bgColor,
      color(avgHue % 360, 40, 15 + avgBrightness * 0.2), // Dynamic brightness influence
      0.15 + pulse * 0.05 // Subtle pulse-driven variation
    );
  }
  
  background(bgColor);
  
  // Improved radial gradient with dynamic outer color
  let gradient = drawingContext.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, max(width, height) * (0.8 + pulse * 0.2) // Dynamic radius
  );
  gradient.addColorStop(0, color(red(bgColor), green(bgColor), blue(bgColor), 255));
  gradient.addColorStop(1, color(
    (currentPalette[1] + noise(t * 0.2) * 30) % 360, // Secondary palette hue with noise
    50, // Moderate saturation
    10, // Dark outer edge
    200 // Slightly transparent for depth
  ));
  
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
  
  // Add subtle noise overlay for texture
  for (let i = 0; i < 33; i++) {
    let x = random(width);
    let y = random(height);
    let n = noise(x * 0.01, y * 0.01, t * 0.1);
    stroke((currentPalette[2] + n * 60) % 360, 30, 50, n * 50); // Noise-driven color
    point(x, y);
  }
}

function drawCosmicNoise() {
  push();
  translate(-width/2, -height/2);
  for (let x = 0; x < width; x += 5) {
    for (let y = 0; y < height; y += 5) {
      let n = noise(x * 0.01, y * 0.01, t * 0.1);
      if (n > 0.7) {
        let size = map(n, 0.7, 1, 0.5, 2);
        let alpha = map(n, 0.7, 1, 50, 200);
        let hue = (frameCount * 0.5 + x + y) % 359;
        fill(hue, 20, 100, alpha);
        noStroke();
        ellipse(x, y, size, size);
      }
    }
  }
  pop();
} 

// Helper function for special particles
function drawTwinklingStar(x, y, size) {
  push();
  translate(x, y);
  rotate(frameCount * 0.01);
  for (let i = 0; i < 5; i++) {
    rotate(PI * 2 / 5);
    triangle(
      0, -size * 0.8,
      size * 0.3, -size * 0.3,
      size * 0.1, -size * 0.1
    );
  }
  pop();
}

function drawMorphingGrid() {
  push();
  stroke(255, 30);
  strokeWeight(0.5);
  let gridSize = 30;
  let distortion = 10 * sin(t * 0.2);
  
  for (let x = -width/2; x < width/2; x += gridSize) {
    beginShape();
    for (let y = -height/2; y < height/2; y += 5) {
      let offsetX = distortion * noise(x * 0.01, y * 0.01, t * 0.1);
      let offsetY = distortion * noise(x * 0.01, y * 0.01, t * 0.1 + 10);
      vertex(x + offsetX, y + offsetY);
    }
    endShape();
  }
  
  for (let y = -height/2; y < height/2; y += gridSize) {
    beginShape();
    for (let x = -width/2; x < width/2; x += 5) {
      let offsetX = distortion * noise(x * 0.01, y * 0.01, t * 0.1);
      let offsetY = distortion * noise(x * 0.01, y * 0.01, t * 0.1 + 10);
      vertex(x + offsetX, y + offsetY);
    }
    endShape();
  }
  pop();
} 

 function drawSacredGeometry() {
  sacredGeometryTimer += 0.01;
  push();
  stroke(255, 100, 100, 100);
  noFill();
  strokeWeight(1);
  
  // Flower of life pattern
  let layers = 3;
  let radius = 50 + 20 * sin(sacredGeometryTimer);
  for (let i = 0; i < layers; i++) {
    let r = radius * (i + 1);
    let circles = 6;
    for (let j = 0; j < circles; j++) {
      let angle = TWO_PI * j / circles + sacredGeometryTimer * 0.2;
      ellipse(r * cos(angle), r * sin(angle), radius * 2, radius * 2);
    }
  }
  
  // Metatron's cube
  if (frameCount % 300 < 150) {
    stroke(200, 100, 100, 150);
    let points = [];
    let sides = 12;
    for (let i = 0; i < sides; i++) {
      let angle = TWO_PI * i / sides + sacredGeometryTimer * 0.1;
      points.push(createVector(100 * cos(angle), 100 * sin(angle)));
    }
    
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        line(points[i].x, points[i].y, points[j].x, points[j].y);
      }
    }
  }
  pop();
}


 

function drawLensFlare(flare) {
  push();
  translate(flare.x, flare.y);
  blendMode(ADD);
  
  // Main flare
  let hue = (frameCount * 0.5) % 360;
  fill(hue, 50, flare.brightness, 50);
  noStroke();
  ellipse(0, 0, flare.size, flare.size);
  
  // Secondary elements
  for (let i = 0; i < flare.elements; i++) {
    let angle = TWO_PI * i / flare.elements;
    let distance = flare.size * (0.3 + 0.2 * sin(t + i));
    let size = flare.size * (0.1 + 0.05 * noise(t * 0.1 + i));
    
    fill(
      (hue + i * 30) % 360,
      60,
      flare.brightness * (0.7 + 0.3 * sin(t + i)),
      30
    );
    ellipse(
      distance * cos(angle + t * 0.1),
      distance * sin(angle + t * 0.1),
      size,
      size
    );
  }
  
  blendMode(BLEND);
  pop();
}  

// Helper function for star shapes
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}


  function drawFractalOverlay() {
  push();
  translate(-width/2, -height/2);
  let scale = 0.01;
  let time = t * 0.05;
  
  for (let x = 0; x < width; x += 5) {
    for (let y = 0; y < height; y += 5) {
      let n = fractalNoise(x * scale, y * scale, time);
      if (n > 0.6) {
        let hue = (n * 360 + frameCount) % 360;
        let alpha = map(n, 0.6, 1, 0, 50);
        stroke(hue, 50, 100, alpha);
        point(x, y);
      }
    }
  }
  pop();
}





function fractalNoise(x, y, t) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 6; i++) { // Increased octaves for richer noise
    value += amplitude * noise(x * frequency, y * frequency, t * frequency);
    amplitude *= 0.45; // Slightly sharper decay
    frequency *= 2.1; // Slightly higher frequency step
  }
  return value;
}

function drawVoronoiCells() {
  // Update voronoi points from particles
  let points = [];
  for (let p of particles) {
    points.push([p.pos.x, p.pos.y]);
  }
  
  // Simple voronoi visualization
  if (points.length > 3) {
    push();
    stroke(255, 30);
    noFill();
    
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let closest = [];
      
      // Find closest points (simplified voronoi)
      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          let d = dist(points[i][0], points[i][1], points[j][0], points[j][1]);
          if (d < minDist) {
            minDist = d;
            closest = points[j];
          }
        }
      }
      
      // Draw edges between points
      if (closest.length > 0) {
        let midX = (points[i][0] + closest[0]) / 2;
        let midY = (points[i][1] + closest[1]) / 2;
        
        // Perpendicular bisector
        let dx = closest[0] - points[i][0];
        let dy = closest[1] - points[i][1];
        let angle = atan2(dy, dx) + HALF_PI;
        
        let len = 100;
        line(
          midX - len * cos(angle),
          midY - len * sin(angle),
          midX + len * cos(angle),
          midY + len * sin(angle)
        );
      }
    }
    pop();
  }
}
 


function drawParticleTrails() {
  // Update trails
  for (let p of particles) {
    p.trail.push({x: p.pos.x, y: p.pos.y, hue: p.hue, alpha: 255});
    if (p.trail.length > 20) {
      p.trail.shift();
    }
  }
  
  // Draw trails
  push();
  blendMode(ADD);
  for (let p of particles) {
    for (let i = 0; i < p.trail.length - 1; i++) {
      let pt1 = p.trail[i];
      let pt2 = p.trail[i + 1];
      let alpha = map(i, 0, p.trail.length, 50, 10);
      
      stroke(p.hue, 80, 100, alpha);
      strokeWeight(p.size * 0.3);
      line(pt1.x, pt1.y, pt2.x, pt2.y);
    }
  }
  blendMode(BLEND);
  pop();
}

function drawRipples() {
  // Update ripples
  for (let ripple of ripples) {
    if (ripple.alpha > 0) {
      ripple.size += 2;
      ripple.alpha -= 2;
    }
  }
  
  // Occasionally create new ripples
  if (random() < 0.02) {
    for (let ripple of ripples) {
      if (ripple.alpha <= 0) {
        ripple.x = random(-width/2, width/2);
        ripple.y = random(-height/2, height/2);
        ripple.size = 5;
        ripple.alpha = 100;
        break;
      }
    }
  }
  
  // Draw ripples
  push();
  noFill();
  for (let ripple of ripples) {
    if (ripple.alpha > 0) {
      let hue = (frameCount * 2) % 360;
      stroke(hue, 80, 100, ripple.alpha);
      strokeWeight(1);
      ellipse(ripple.x, ripple.y, ripple.size, ripple.size);
    }
  }
  pop();
}  
 

function drawRipples() {
  // Update ripples with physics
  for (let ripple of ripples) {
    if (ripple.alpha > 0) {
      // Dynamic growth based on ripple age
      ripple.size += map(ripple.size, 0, width, 3, 0.5);
      ripple.alpha -= map(ripple.size, 0, width*0.5, 1.5, 0.3);
      
      // Ripple distortion effect
      ripple.waveOffset = sin(t * 3 + ripple.size * 0.1) * 2;
    }
  }
  
  // Create new ripples with more interesting patterns
  if (random() < 0.03) {
    // Cluster ripples occasionally
    let clusterSize = random() > 0.8 ? floor(random(3, 7)) : 1;
    
    for (let i = 0; i < clusterSize; i++) {
      let availableRipple = ripples.find(r => r.alpha <= 0);
      if (availableRipple) {
        let baseX = random(-width/2, width/2);
        let baseY = random(-height/2, height/2);
        
        availableRipple.x = baseX + (i > 0 ? random(-50, 50) : 0);
        availableRipple.y = baseY + (i > 0 ? random(-50, 50) : 0);
        availableRipple.size = random(5, 15);
        availableRipple.alpha = random(80, 120);
        availableRipple.hue = (frameCount * 2 + random(60)) % 360;
        availableRipple.waveOffset = 0;
      }
    }
  }
  
  // Draw ripples with multiple layers
  push();
  noFill();
  blendMode(ADD);
  
  for (let ripple of ripples) {
    if (ripple.alpha > 0) {
      // Dynamic color
      let hue = (ripple.hue + ripple.size * 0.2) % 360;
      
      // Main ripple
      stroke(hue, 80, 100, ripple.alpha);
      strokeWeight(1.2);
      ellipse(
        ripple.x + ripple.waveOffset,
        ripple.y + ripple.waveOffset,
        ripple.size,
        ripple.size
      );
      
      // Secondary ripple (offset)
      if (ripple.size > 30) {
        stroke(hue, 60, 100, ripple.alpha * 0.6);
        strokeWeight(0.8);
        ellipse(
          ripple.x - ripple.waveOffset * 0.7,
          ripple.y - ripple.waveOffset * 0.7,
          ripple.size * 0.9,
          ripple.size * 0.9
        );
      }
      
      // Glow effect for larger ripples
      if (ripple.size > 50) {
        stroke(hue, 40, 100, ripple.alpha * 0.3);
        strokeWeight(4);
        ellipse(ripple.x, ripple.y, ripple.size * 1.2, ripple.size * 1.2);
      }
    }
  }
  
  // Add occasional "splash" particles
  if (random() < 0.1) {
    let activeRipples = ripples.filter(r => r.alpha > 0 && r.size < 50);
    if (activeRipples.length > 0) {
      let ripple = random(activeRipples);
      for (let i = 0; i < 8; i++) {
        let angle = random(TWO_PI);
        let dist = random(5, 15);
        let size = random(1, 3);
        
        fill(ripple.hue, 100, 100, random(80, 120));
        noStroke();
        ellipse(
          ripple.x + cos(angle) * dist,
          ripple.y + sin(angle) * dist,
          size,
          size
        );
      }
    }
  }
  
  blendMode(BLEND);
  pop();
}

 

function applyFilmGrain() {
  push();
  blendMode(OVERLAY);
  for (let x = 0; x < width; x += 2) {
    for (let y = 0; y < height; y += 2) {
      let n = random(255);
      stroke(n, n, n, 10);
      point(x, y);
    }
  }
  blendMode(BLEND);
  pop();
}

function triggerSpecialEffect() {
  // Randomly choose a special effect
  let effect = floor(random(4));
  
  switch(effect) {
    case 0: // Particle burst
      for (let i = 0; i < 30; i++) {
        particles.push(createParticle());
      }
      break;
      
    case 1: // Big ripple
      for (let ripple of ripples) {
        ripple.x = random(-width/2, width/2);
        ripple.y = random(-height/2, height/2);
        ripple.size = 5;
        ripple.alpha = 200;
      }
      break;
      
    case 2: // Flash
      push();
      blendMode(SCREEN);
      fill(360, 0, 100, 50);
      rect(-width/2, -height/2, width, height);
      blendMode(BLEND);
      pop();
      break;
      
    case 3: // Color shift
      randomizePalette(currentCurve);
      break;
  }
}





 

function triggerSpecialEffect() {
  let effect = floor(random(6)); // Expanded effect pool
  let currentPalette = colorPalettes[currentCurve % colorPalettes.length];

  switch (effect) {
    case 0: // Particle burst with palette colors
      for (let i = 0; i < 50; i++) { // More particles
        let p = createParticle();
        p.hue = random(currentPalette); // Use palette hues
        p.brightness = 80 + random(20); // Bright particles
        particles.push(p);
      }
      break;

    case 1: // Big ripple with dynamic spread
      for (let ripple of ripples) {
        ripple.x = random(-width/2, width/2) + 5 * noise(t + ripple.x);
        ripple.y = random(-height/2, height/2) + 5 * noise(t + ripple.y);
        ripple.size = 10 + 5 * noise(t); // Variable size
        ripple.alpha = 180 + 20 * sin(t * 0.5); // Pulsing opacity
      }
      break;

    case 2: // Flash with palette-based glow
      push();
      blendMode(SCREEN);
      let hue = currentPalette[floor(random(3))];
      fill(hue, 50, 90, 60 + 20 * sin(t * 0.3)); // Dynamic opacity
      rect(-width/2, -height/2, width, height);
      blendMode(BLEND);
      pop();
      break;

    case 3: // Color shift with smooth transition
      randomizePalette(currentCurve);
      transitionProgress = 0; // Reset for smooth palette transition
      break;

    case 4: // Lens flare burst
      for (let i = 0; i < 10; i++) {
        let flare = createLensFlare();
        flare.hue = random(currentPalette); // Palette-based flares
        flare.brightness = 90 + random(10);
        flare.size = 20 + random(20) * (1 + 0.5 * noise(t + i));
        flare.pulseSpeed *= 1.5; // Faster pulsing
        lensFlares.push(flare);
      }
      break;

    case 5: // Fractal storm
      push();
      blendMode(ADD);
      for (let i = 0; i < 200; i++) { // Dense point cloud
        let x = random(-width/2, width/2);
        let y = random(-height/2, height/2);
        let n = fractalNoise(x * 0.01, y * 0.01, t * 0.1);
        if (n > 0.5) {
          stroke(currentPalette[2], 50, 100, 50 + 30 * n);
          strokeWeight(2 + n);
          point(x + 5 * noise(t + i), y + 5 * noise(t + i + 10));
        }
      }
      blendMode(BLEND);
      pop();
      break;
  }
}









function drawParametricCurve() {
  let resolution = 400;
  let size = maxRadius * (1.0 + 0.15 * noise(t/8));
  
  beginShape();
  for (let i = 0; i <= resolution; i++) {
    let theta = map(i, 0, resolution, 0, TWO_PI * 4);
    let point = calculateCurvePoint(theta, size, currentCurve);
    
    if (point) {
      let palette = colorPalettes[currentCurve % colorPalettes.length];
      let prevPalette = prevPalettes[currentCurve % colorPalettes.length];
      let hue = lerp(prevPalette[0], palette[0], transitionProgress);
      if (usePlasmaColor) {
        hue = getPlasmaHue(point.x, point.y, t) + 120 * sin(theta/10 + t + noise(theta/4));
      } else {
        hue = (hue + 120 * sin(theta/10 + t + noise(theta/4)));
      }
      hue %= 360;
      stroke(hue, 80, 90);
      strokeWeight(2);
      if (centralScaling) {
        let rPoint = sqrt(point.x * point.x + point.y * point.y);
        if (rPoint < minRadius) {
          let scaleFactor = minRadius / (rPoint + 0.01);
          scaleFactor = constrain(scaleFactor, 0.5, 2);
          point.x *= scaleFactor;
          point.y *= scaleFactor;
        }
      }
      vertex(point.x, point.y);
    }
  }
  endShape();
}

function drawAdditionalCurves() {
  for (let layer = 0; layer < 4; layer++) { // Increased to 4 layers
    let size = maxRadius * (0.6 + 0.2 * layer);
    let hue = lerp(
      prevPalettes[currentCurve % colorPalettes.length][0],
      colorPalettes[currentCurve % colorPalettes.length][0],
      transitionProgress
    ) + 60 * layer;
    hue %= 360;
    let resolution = 600;
    
    push();
    rotate(t * 0.02 * (layer % 2 ? 1 : -1));
    beginShape();
    for (let i = 0; i <= resolution; i++) {
      let theta = map(i, 0, resolution, 0, TWO_PI * (3 + layer));
      let zDepth = 0.5 + 0.5 * sin(theta + t * 0.1 + layer); // 3D depth
      let point = calculateCurvePoint(theta, size * zDepth, 100 + layer); // Use calculateCurvePoint
      stroke(hue, 85, 95, 0.5);
      strokeWeight(1.5 / zDepth); // Thinner lines for "farther" points
      vertex(point.x, point.y);
    }
    endShape();
    pop();
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    if (t - p.birthTime > p.life * 10) {
      particles.splice(i, 1);
      particles.push({
        pos: createVector(),
        speed: random(0.005, 0.1),
        offset: random(TWO_PI),
        hue: lerp(
          prevPalettes[currentCurve % colorPalettes.length][floor(random(3))],
          colorPalettes[currentCurve % colorPalettes.length][floor(random(3))],
          transitionProgress
        ) + random(-40, 40) % 360,
        size: random(1, 15),
        life: random(0.2, 2.5),
        birthTime: t,
        shapeType: floor(random(14)),
        pulseOffset: random(TWO_PI),
        tailType: floor(random(8)),
        velocity: createVector(random(-0.7, 0.7), random(-0.7, 0.7)),
        zDepth: random(0.5, 1.5)
      });
      continue;
    }
    
    let theta = (t * p.speed + p.offset) * TWO_PI;
    let r = max(width, height) * 0.4 * (0.7 + 0.3 * noise(p.offset + t/8));
    let pos = calculateCurvePoint(theta, r * p.zDepth, currentCurve);
    
    pos.x += p.velocity.x * p.zDepth;
    pos.y += p.velocity.y * p.zDepth;
    p.velocity.x += random(-0.15, 0.15) * noise(t + p.offset);
    p.velocity.y += random(-0.15, 0.15) * noise(t + p.offset + 100);
    
    if (transitionProgress > 0) {
      let nextPos = calculateCurvePoint(theta, r * p.zDepth, nextCurve);
      pos.x = lerp(pos.x, nextPos.x, transitionProgress);
      pos.y = lerp(pos.y, nextPos.y, transitionProgress);
    }
    
    let alpha = map(t - p.birthTime, 0, p.life * 10, 1, 0.2, true);
    let particleHue = p.hue;
    if (usePlasmaColor) {
      particleHue = getPlasmaHue(pos.x, pos.y, t);
    }
    fill(particleHue, 90, 100, alpha * 0.6 * p.zDepth);
    noStroke();
    
    let pulseSize = p.size * (0.9 + 0.4 * sin(t*5 + p.pulseOffset)) * p.zDepth;
    drawShape(pos.x, pos.y, pulseSize, p.shapeType);
    
    stroke(particleHue, 90, 100, alpha * 0.4);
    strokeWeight(1 / p.zDepth);
    beginShape();
    for (let h = 0; h < 15; h++) {
      let tTail = map(h, 0, 15, 0, TWO_PI);
      let rTail, xTail, yTail;
      if (p.tailType === 0) {
        rTail = p.size * 0.5 * cos(4 * tTail + t * 0.5);
        xTail = pos.x + rTail * cos(tTail);
        yTail = pos.y + rTail * sin(tTail);
      } else if (p.tailType === 1) {
        rTail = p.size * 0.3;
        xTail = pos.x + rTail * (tTail - sin(tTail + t * 0.5));
        yTail = pos.y + rTail * (1 - cos(tTail + t * 0.5));
      } else if (p.tailType === 2) {
        rTail = p.size * 0.5 * (1 + 0.7 * cos(tTail + t * 0.5));
        xTail = pos.x + rTail * cos(tTail);
        yTail = pos.y + rTail * sin(tTail);
      } else if (p.tailType === 3) {
        rTail = p.size * 0.5 * cos(6 * tTail + t * 0.5);
        xTail = pos.x + rTail * cos(tTail);
        yTail = pos.y + rTail * sin(tTail);
      } else if (p.tailType === 4) {
        rTail = p.size * 0.4 * (1 + 0.3 * tTail/TWO_PI);
        xTail = pos.x + rTail * cos(tTail + t);
        yTail = pos.y + rTail * sin(tTail + t);
      } else if (p.tailType === 5) {
        rTail = p.size * 0.3 * (1 + 0.5 * sin(5 * tTail + t));
        xTail = pos.x + rTail * cos(tTail);
        yTail = pos.y + rTail * sin(tTail);
      } else if (p.tailType === 6) {
        rTail = p.size * 0.4 * (1 + 0.2 * noise(tTail + t));
        xTail = pos.x + rTail * cos(tTail);
        yTail = pos.y + rTail * sin(tTail);
      } else if (p.tailType === 7) {
        rTail = p.size * 0.3 * (1 + 0.4 * sin(3 * tTail + t));
        xTail = pos.x + rTail * cos(tTail + 0.5 * sin(tTail));
        yTail = pos.y + rTail * sin(tTail + 0.5 * cos(tTail));
      }
      vertex(xTail, yTail);
    }
    endShape();
    
    p.pos = pos;
  }
}

function drawCurveType(type, weight) {
  let resolution = 600;
  let size = max(width, height) * 0.45 + minRadius;
  let palette = colorPalettes[type % colorPalettes.length];
  let prevPalette = prevPalettes[type % colorPalettes.length];
  
  push();
  rotate(t * 0.05 * ((type % 2) ? 1 : -1));
  drawingContext.filter = 'blur(2px)'; // Glow for main curve
  beginShape();
  for (let i = 0; i <= resolution; i++) {
    let theta = map(i, 0, resolution, 0, TWO_PI * 6);
    let zDepth = 0.5 + 0.5 * sin(theta + t * 0.1); // 3D depth
    let point = calculateCurvePoint(theta, size * zDepth, type);
    
    let hue = lerp(prevPalette[i % 3], palette[i % 3], transitionProgress);
    if (usePlasmaColor) {
      hue = getPlasmaHue(point.x, point.y, t) + 60 * sin(theta/12 + t/2 + type + noise(theta/8));
    } else {
      hue = (hue + 60 * sin(theta/12 + t/2 + type + noise(theta/8)));
    }
    hue %= 360;
    stroke(hue, 85, 95, weight * 0.8);
    strokeWeight(2.2 * weight / zDepth);
    if (centralScaling) {
      let rPoint = sqrt(point.x * point.x + point.y * point.y);
      if (rPoint < minRadius) {
        let scaleFactor = minRadius / (rPoint + 0.01);
        scaleFactor = constrain(scaleFactor, 0.5, 2);
        point.x *= scaleFactor;
        point.y *= scaleFactor;
      }
    }
    vertex(point.x, point.y);
  }
  endShape();
  drawingContext.filter = 'none';
  pop();
}

function getPlasmaHue(x, y, time) {
  let scale = 0.005;
  x *= scale;
  y *= scale;
  time *= 0.1;
  
  let val = 0;
  let amp = 1;
  let freq = 1;
  let octaves = 4;
  
  for (let i = 0; i < octaves; i++) {
    val += amp * noise(freq * x + time, freq * y + time, time);
    amp *= 0.5;
    freq *= 2;
  }
  
  val /= (2 - 1 / Math.pow(2, octaves - 1));
  return map(val, 0, 1, 200, 360);
}

function drawShape(x, y, size, shapeType) {
  beginShape();
  if (shapeType === 0) {
    for (let i = 0; i < 3; i++) {
      let angle = TWO_PI * i / 3 + PI / 2;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 1) {
    for (let i = 0; i < 4; i++) {
      let angle = TWO_PI * i / 4 + PI / 4;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 2) {
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI * i / 5 + PI / 2;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 3) {
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI * i / 6 + PI / 2;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 4) {
    for (let i = 0; i < 10; i++) {
      let r = i % 2 === 0 ? size : size * 0.5;
      let angle = TWO_PI * i / 10 + PI / 2;
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
  } else if (shapeType === 5) {
    for (let i = 0; i < 7; i++) {
      let angle = TWO_PI * i / 7 + PI / 2;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 6) {
    for (let i = 0; i < 8; i++) {
      let angle = TWO_PI * i / 8 + PI / 2;
      vertex(x + size * cos(angle), y + size * sin(angle));
    }
  } else if (shapeType === 7) {
    let s = size * 0.8;
    vertex(x - s, y);
    vertex(x - s/3, y);
    vertex(x - s/3, y - s);
    vertex(x + s/3, y - s);
    vertex(x + s/3, y - s/3);
    vertex(x + s, y - s/3);
    vertex(x + s, y + s/3);
    vertex(x + s/3, y + s/3);
    vertex(x + s/3, y + s);
    vertex(x - s/3, y + s);
    vertex(x - s/3, y + s/3);
    vertex(x - s, y + s/3);
  } else if (shapeType === 8) {
    let r1 = size, r2 = size * 0.7;
    for (let i = 0; i <= 10; i++) {
      let angle = PI * i / 10;
      vertex(x + r1 * cos(angle), y + r1 * sin(angle));
    }
    for (let i = 10; i >= 0; i--) {
      let angle = PI * i / 10;
      vertex(x + r2 * cos(angle + PI/4), y + r2 * sin(angle + PI/4));
    }
  } else if (shapeType === 9) {
    for (let i = 0; i < 12; i++) {
      let angle = TWO_PI * i / 12;
      let r = size * (0.8 + 0.2 * noise(i + t));
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
  } else if (shapeType === 10) {
    let sides = floor(random(5, 9));
    for (let i = 0; i < sides; i++) {
      let angle = TWO_PI * i / sides + random(-0.1, 0.1);
      let r = size * (0.7 + random(0.3));
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
  } else if (shapeType === 11) {
    for (let i = 0; i < 8; i++) {
      let r = i % 2 === 0 ? size * 1.2 : size * 0.4;
      let angle = TWO_PI * i / 8 + random(-0.15, 0.15);
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
  } else if (shapeType === 12) {
    for (let i = 0; i < 16; i++) {
      let angle = TWO_PI * i / 16;
      let r = size * (0.7 + 0.3 * noise(i * 0.5 + t * 0.2));
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
  } else if (shapeType === 13) {
    let s = size * 0.8;
    let tShift = t * 0.5;
    let vertices = [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
    ];
    let edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    for (let edge of edges) {
      let v1 = vertices[edge[0]], v2 = vertices[edge[1]];
      let x1 = v1[0] * cos(tShift) - v1[2] * sin(tShift);
      let z1 = v1[0] * sin(tShift) + v1[2] * cos(tShift);
      let x2 = v2[0] * cos(tShift) - v2[2] * sin(tShift);
      let z2 = v2[0] * sin(tShift) + v2[2] * cos(tShift);
      let scale1 = 200 / (200 + z1), scale2 = 200 / (200 + z2);
      vertex(x + x1 * scale1, y + v1[1] * scale1);
      vertex(x + x2 * scale2, y + v2[1] * scale2);
    }
  }
  endShape(CLOSE);
}

function calculateCurvePoint(theta, r, type) {
  try {
    let n3 = 0.5 + noise(t/10 + (type || 0) * 2);
    let tFactor = t * (0.8 + 0.2 * noise(t/15 + (type || 0)));
    let zDepth = 0.5 + 0.5 * sin(theta + t * 0.1); // 3D depth modulation
    
    let point;
    switch(type) {
      case 0: point = createVector(r * cos(param1 * theta) * cos(theta * n3 + t), r * sin(param2 * theta) * sin(theta * 0.8 - t/2) * zDepth); break;
      case 1: let spiral = r * (0.6 + 0.3 * noise(theta/8 + t)); point = createVector(spiral * cos(theta) + r/5 * cos(9 * theta + t*1.3), spiral * sin(theta) - r/5 * sin(7 * theta - t*1.1) * zDepth); break;
      case 2: point = createVector(r * sin(theta * param1 + t*1.3) * cos(theta * param2 - t/2), r * cos(theta * param2 - t*1.7) * sin(theta * param1 + t/3) * zDepth); break;
      case 3: point = createVector(r * cos(theta) * (1 + 0.25 * sin(7 * theta + t*3)), r * sin(theta) * (1 + 0.25 * cos(5 * theta - t*2)) * zDepth); break;
      case 4: let vortex = r * (0.3 + 0.5 * pow(sin(theta/2 + t), 2)); point = createVector(vortex * cos(theta + 5 * sin(theta/3 + t/4)), vortex * sin(theta + 5 * cos(theta/4 - t/5)) * zDepth); break;
      case 5: point = createVector(r * sin(3 * theta + t * 1.2) * cos(2 * theta - t * 0.7), r * cos(4 * theta - t * 0.9) * sin(5 * theta + t * 1.1) * zDepth); break;
      case 6: let branch = r * (0.4 + 0.1 * noise(theta * 5 + t)); point = createVector(branch * cos(theta) * (1 + 0.3 * sin(13 * theta + t*2)), branch * sin(theta) * (1 + 0.3 * cos(11 * theta - t*1.5)) * zDepth); break;
      case 7: let orbital = r * (0.7 + 0.2 * sin(theta * 2 + t * 3)); point = createVector(orbital * cos(theta + sin(theta * 7 + t * 2)), orbital * sin(theta + cos(theta * 6 - t * 1.8)) * zDepth); break;
      case 8: point = createVector(r * tan(theta * param1 * 0.2 + t) * cos(theta * param2 * 0.3), r * tan(theta * param2 * 0.25 - t) * sin(theta * param1 * 0.35) * zDepth); break;
      case 9: let flux = r * (0.5 + 0.3 * atan(sin(theta * 3 + t))); point = createVector(flux * cos(theta) + r/4 * log(abs(5 * theta + t)), flux * sin(theta) - r/4 * log(abs(4 * theta - t)) * zDepth); break;
      case 10: point = createVector(r * pow(sin(theta * 0.7 + t), 3) * cos(theta * 2), r * pow(cos(theta * 0.8 - t), 3) * sin(theta * 2.5) * zDepth); break;
      case 11: let bio = r * (0.4 + 0.2 * (exp(sin(theta + t)) - 0.5)); point = createVector(bio * cos(theta) * (1 + 0.4 * sin(17 * theta + t*4)), bio * sin(theta) * (1 + 0.4 * cos(19 * theta - t*3)) * zDepth); break;
      case 12: let well = r * (0.3 + 0.6 / (1 + 0.5 * abs(theta - PI + t))); point = createVector(well * cos(theta + t/3), well * sin(theta - t/4) * zDepth); break;
      case 13: point = createVector(r * sin(theta + t) * cos(2 * theta + t/2) * (1 + 0.2 * sin(23 * theta)), r * cos(theta - t) * sin(3 * theta - t/3) * (1 + 0.2 * cos(19 * theta)) * zDepth); break;
      case 14: point = createVector(r * pow(cos(theta * param1), 2) * cos(3 * theta + tFactor), r * pow(sin(theta * param2), 2) * sin(2 * theta - tFactor) * zDepth); break;
      case 15: let torus = r * (0.5 + 0.3 * sin(theta * 4 + tFactor * 2)); point = createVector(torus * cos(theta) + r/3 * sin(theta * 7 + tFactor), torus * sin(theta) - r/3 * cos(theta * 5 - tFactor) * zDepth); break;
      case 16: let fib = r * (0.4 + 0.1 * (theta % TWO_PI)/PI); point = createVector(fib * cos(theta + tFactor) * (1 + 0.2 * sin(13 * theta)), fib * sin(theta - tFactor) * (1 + 0.2 * cos(11 * theta)) * zDepth); break;
      case 17: point = createVector(r * (cos(theta * param1 + tFactor) + 0.3 * noise(theta * 10 + tFactor)) * cos(theta + t/5), r * (sin(theta * param2 + tFactor) + 0.3 * noise(theta * 12 - tFactor)) * sin(theta - t/7) * zDepth); break;
      case 18: let nebula = r * (0.6 + 0.2 * pow(sin(theta * 0.7 + tFactor * 0.3), 3)); point = createVector(nebula * cos(theta) * (1 + 0.4 * tan(theta * 3 + tFactor * 0.5)), nebula * sin(theta) * (1 + 0.4 * tan(theta * 4 - tFactor * 0.6)) * zDepth); break;
      case 19: point = createVector(r * sin(theta * param1) * cos(theta * param2 + tFactor) * (1 + 0.2 * sin(17 * theta)), r * cos(theta * param2) * sin(theta * param1 - tFactor) * (1 + 0.2 * cos(19 * theta)) * zDepth); break;
      case 20: point = createVector(r * tan(theta * 0.3 + tFactor * 0.2) * cos(theta * 2), r * tan(theta * 0.4 - tFactor * 0.3) * sin(theta * 1.5) * zDepth); break;
      case 21: let aurora = r * (0.7 + 0.1 * atan(sin(theta * 5 + tFactor * 2))); point = createVector(aurora * cos(theta + sin(theta * 9 + tFactor)), aurora * sin(theta - cos(theta * 8 - tFactor)) * zDepth); break;
      case 22: let bloom = r * (0.4 + 0.3 * pow(sin(theta * 0.5 + tFactor * 0.4), 5)); point = createVector(bloom * cos(theta) * (1 + 0.5 * sin(23 * theta + tFactor * 3)), bloom * sin(theta) * (1 + 0.5 * cos(21 * theta - tFactor * 2)) * zDepth); break;
      case 23: point = createVector(r * asin(sin(theta + tFactor)) * cos(3 * theta), r * acos(cos(theta - tFactor)) * sin(2 * theta) * zDepth); break;
      case 24: let star = r * (0.5 + 0.3 * sin(theta * 5 + tFactor * 1.5)); point = createVector(star * cos(theta) * (1 + 0.3 * sin(8 * theta + tFactor * 2)), star * sin(theta) * (1 + 0.3 * cos(8 * theta - tFactor * 2)) * zDepth); break;
      case 25: let a = r * 0.6, b = r * 0.2; point = createVector((a + b) * cos(theta) - b * cos((a/b + 1) * theta + tFactor), (a + b) * sin(theta) - b * sin((a/b + 1) * theta + tFactor) * zDepth); break;
      case 26: let c = r * 0.7, d = r * 0.175; point = createVector((c - d) * cos(theta) + d * cos((c/d - 1) * theta - tFactor), (c - d) * sin(theta) - d * sin((c/d - 1) * theta - tFactor) * zDepth); break;
      case 27: point = createVector(r * sin(3 * theta + tFactor * 0.8) * cos(theta * param1), r * sin(4 * theta - tFactor * 0.9) * sin(theta * param2) * zDepth); break;
      case 28: let R = r * 0.6, r2 = r * 0.3; point = createVector((R + r2 * cos(theta * 5 + tFactor)) * cos(theta), (R + r2 * sin(theta * 5 + tFactor)) * sin(theta) * zDepth); break;
      case 29: let cat = r * (cosh(theta * 0.5 + tFactor * 0.5) - 1); point = createVector(cat * cos(theta + tFactor * 0.3), cat * sin(theta - tFactor * 0.3) * zDepth); break;
      case 30: point = createVector(r * (cos(theta + tFactor) + theta * sin(theta + tFactor)), r * (sin(theta + tFactor) - theta * cos(theta + tFactor)) * zDepth); break;
      case 31: let arch = r * (0.1 + 0.4 * (theta / TWO_PI + tFactor * 0.2)); point = createVector(arch * cos(theta), arch * sin(theta) * zDepth); break;
      case 32: let card = r * (1 + cos(theta + tFactor * 0.7)); point = createVector(card * cos(theta), card * sin(theta) * zDepth); break;
      case 33: let lem = r * sqrt(abs(cos(2 * theta + tFactor))); point = createVector(lem * cos(theta) * (1 + 0.2 * sin(6 * theta + tFactor)), lem * sin(theta) * (1 + 0.2 * cos(6 * theta - tFactor)) * zDepth); break;
      case 34: point = createVector(r * (2 * cos(theta + tFactor) + cos(2 * theta + tFactor * 2)), r * (2 * sin(theta + tFactor) - sin(2 * theta + tFactor * 2)) * zDepth); break;
      case 35: point = createVector(r * pow(cos(theta + tFactor), 3), r * pow(sin(theta + tFactor), 3) * zDepth); break;
      case 36: let k = r * 0.5; point = createVector(k * (3 * cos(theta) - cos(3 * theta + tFactor)), k * (3 * sin(theta) - sin(3 * theta + tFactor)) * zDepth); break;
      case 37: let a1 = r * 0.7, b1 = r * 0.5; point = createVector((a1 * a1 - b1 * b1) * cos(theta + tFactor) * cos(theta) / a1, (a1 * a1 - b1 * b1) * sin(theta + tFactor) * sin(theta) / b1 * zDepth); break;
      case 38: let k1 = 0.1 + 0.05 * noise(tFactor); point = createVector(r * exp(k1 * theta) * cos(theta + tFactor * 0.5), r * exp(k1 * theta) * sin(theta + tFactor * 0.5) * zDepth); break;
      case 39: let s = theta * 0.5 + tFactor; point = createVector(r * 0.5 * cos(s * s) * (1 + 0.2 * sin(5 * theta + tFactor)), r * 0.5 * sin(s * s) * (1 + 0.2 * cos(5 * theta + tFactor)) * zDepth); break;
      case 40: let tr = r * (1 + 0.2 * noise(theta + tFactor)); point = createVector(tr * (cos(theta) + log(tan(theta / 2 + tFactor * 0.1))), tr * sin(theta) * zDepth); break;
      case 41: let cis = r * sin(theta) * sin(theta + tFactor); point = createVector(cis * cos(theta) / (1 - sin(theta + tFactor)), cis * sin(theta) / (1 - sin(theta + tFactor)) * zDepth); break;
      case 42: let n = floor(param1 + 0.5); point = createVector(r * cos(n * theta + tFactor) * cos(theta), r * cos(n * theta + tFactor) * sin(theta) * zDepth); break;
      case 43: let theo = r * sqrt(theta / PI + tFactor * 0.3); point = createVector(theo * cos(theta), theo * sin(theta) * zDepth); break;
      case 44: let a2 = r * 0.5, b2 = r * 0.7; point = createVector(a2 * cos(theta) + b2 * cos(theta + tFactor) / cos(theta), a2 * sin(theta) + b2 * sin(theta + tFactor) / cos(theta) * zDepth); break;
      case 45: let a3 = r * 0.5; point = createVector(a3 * (cos(theta) - cos(2 * theta + tFactor)) / sin(theta), a3 * (cos(theta) + cos(2 * theta + tFactor)) * sin(theta) * zDepth); break;
      case 46: let a4 = r * 0.6, b4 = r * 0.4; point = createVector((a4 + b4 * cos(theta + tFactor)) * cos(theta), (a4 + b4 * cos(theta + tFactor)) * sin(theta) * zDepth); break;
      case 47: let a5 = r * 0.5; point = createVector(a5 * (1 / cos(theta) + cos(theta + tFactor)) * cos(theta), a5 * (1 / cos(theta) + cos(theta + tFactor)) * sin(theta) * zDepth); break;
      case 48: let a6 = r * 0.6; point = createVector(a6 * cos(theta) / (1 + sin(theta + tFactor)), a6 * cos(theta) * sin(theta + tFactor) / (1 + sin(theta + tFactor)) * zDepth); break;
      case 49: let a7 = r * 0.6, b7 = r * 0.3; point = createVector(a7 * (1 + sin(theta + tFactor)) * cos(theta), b7 * (1 + sin(theta + tFactor)) * sin(theta) * zDepth); break;
      case 50: let a8 = r * 0.5; point = createVector(a8 * (pow(theta, 2) * cos(theta + tFactor) - theta * sin(theta)), a8 * (pow(theta, 2) * sin(theta + tFactor) + theta * cos(theta)) * zDepth); break;
      case 51: let a9 = r * 0.5, c9 = r * 0.7; let rho = sqrt(pow(a9 * cos(2 * theta + tFactor), 2) + c9 * c9); point = createVector(rho * cos(theta), rho * sin(theta) * zDepth); break;
      case 52: let a10 = r * 0.6, b10 = r * 0.4; let m = sqrt(a10 * a10 - b10 * b10 * sin(theta + tFactor) * sin(theta + tFactor)); point = createVector(m * cos(theta), b10 * sin(theta + tFactor) * zDepth); break;
      case 53: let a11 = r * 0.5; point = createVector(a11 * theta * sinh(theta + tFactor * 0.3), a11 * (cosh(theta + tFactor * 0.3) - 1) * zDepth); break;
      case 54: let a12 = r * 0.6; point = createVector(a12 * sin(theta + tFactor) * cos(2 * theta + tFactor * 0.5), a12 * cos(theta + tFactor) * sin(2 * theta + tFactor * 0.5) * zDepth); break;
      case 55: let a13 = r * 0.5; point = createVector(a13 * 3 * cos(theta) / (1 + pow(sin(theta + tFactor), 3)), a13 * 3 * cos(theta) * sin(theta + tFactor) / (1 + pow(sin(theta + tFactor), 3)) * zDepth); break;
      case 56: let a14 = r * 0.6; point = createVector(a14 * (2 * cos(theta + tFactor) + 1) * cos(theta), a14 * (2 * cos(theta + tFactor) + 1) * sin(theta) * zDepth); break;
      case 57: let a15 = r * 0.5; point = createVector(a15 * cos(theta) * (cos(theta) - sin(theta + tFactor)) / sin(theta), a15 * cos(theta) * (cos(theta) + sin(theta + tFactor)) * zDepth); break;
      case 58: let a16 = r * 0.5; point = createVector(a16 * pow(theta, 2) * cos(theta + tFactor), a16 * pow(theta, 3) * sin(theta + tFactor) * zDepth); break;
      case 59: let a17 = r * 0.5; point = createVector(a17 * (3 * cos(theta) - cos(3 * theta + tFactor)), a17 * 3 * sin(theta) * cos(theta + tFactor) * cos(theta + tFactor) * zDepth); break;
      case 60: let a18 = r * 0.6, b18 = r * 0.3; point = createVector(a18 * cos(theta) + b18 * sin(theta + tFactor) / cos(theta), a18 * sin(theta) + b18 * cos(theta + tFactor) / cos(theta) * zDepth); break;
      case 61: let a19 = r * 0.5; point = createVector(a19 * cos(theta) / (1 + pow(sin(theta + tFactor), 2)), a19 * cos(theta) * sin(theta + tFactor) / (1 + pow(sin(theta + tFactor), 2)) * zDepth); break;
      case 62: let a20 = r * 0.5; point = createVector(a20 * (theta - sin(theta + tFactor)), a20 * (1 - cos(theta + tFactor)) * zDepth); break;
      case 63: let a21 = r * 0.6, b21 = r * 0.4; let rho2 = sqrt((pow(a21 * sin(theta + tFactor), 2) - pow(b21 * cos(theta), 2)) / (1 - 0.5 * sin(theta + tFactor) * sin(theta + tFactor))); point = createVector(rho2 * cos(theta), rho2 * sin(theta) * zDepth); break;
      case 64: let a22 = r * 0.5, n22 = floor(param1 + 0.5); point = createVector(a22 * pow(abs(cos(theta + tFactor)), 1/n22) * cos(theta), a22 * pow(abs(sin(theta + tFactor)), 1/n22) * sin(theta) * zDepth); break;
      case 65: let a23 = r * 0.5; point = createVector(a23 * 2 * cos(theta) * (1 + 0.2 * sin(5 * theta + tFactor)), a23 * 2 / (1 + pow(tan(theta + tFactor), 2)) * zDepth); break;
      case 66: let a24 = r * 0.5; point = createVector(a24 * (theta + sinh(theta + tFactor) * cos(theta)), a24 * (cosh(theta + tFactor) - sin(theta)) * zDepth); break;
      case 67: let a25 = r * 0.6; point = createVector(a25 * (3 * cos(theta + tFactor) - 1) * cos(theta), a25 * (3 * cos(theta + tFactor) - 1) * sin(theta) * zDepth); break;
      case 68: let a26 = r * 0.5; point = createVector(a26 * sqrt(1 / (theta + tFactor + 0.1)) * cos(theta), a26 * sqrt(1 / (theta + tFactor + 0.1)) * sin(theta) * zDepth); break;
      case 69: let a27 = r * 0.5; point = createVector(a27 * 2 * sin(theta) * cos(theta + tFactor) / (1 + pow(cos(theta + tFactor), 2)), a27 * 2 * sin(theta) * sin(theta + tFactor) / (1 + pow(cos(theta + tFactor), 2)) * zDepth); break;
      case 70: let a28 = r * 0.5; point = createVector(a28 * cos(theta) * (1 + 0.3 * noise(theta/5 + tFactor)), a28 / (1 + pow(theta + tFactor, 2)) * zDepth); break;
      case 71: let a29 = r * 0.6, b29 = r * 0.2, d29 = r * 0.3; point = createVector((a29 + b29) * cos(theta) - d29 * cos((a29/b29 + 1) * theta + tFactor), (a29 + b29) * sin(theta) - d29 * sin((a29/b29 + 1) * theta + tFactor) * zDepth); break;
      case 72: let a30 = r * 0.7, b30 = r * 0.2, d30 = r * 0.25; point = createVector((a30 - b30) * cos(theta) + d30 * cos((a30/b30 - 1) * theta - tFactor), (a30 - b30) * sin(theta) - d30 * sin((a30/b30 - 1) * theta - tFactor) * zDepth); break;
      case 74: let a32 = r * 0.5; point = createVector(a32 * sin(theta + tFactor) / (1 + pow(cos(theta), 2)), a32 * sin(theta) * cos(theta + tFactor) / (1 + pow(cos(theta), 2)) * zDepth); break;
      case 75: let a33 = r * 0.5, b33 = r * 0.6; point = createVector(a33 * cos(theta) + b33 * sin(theta + tFactor) * cos(theta), a33 * sin(theta) + b33 * sin(theta + tFactor) * sin(theta) * zDepth); break;
      case 76: let a34 = r * 0.5; point = createVector(a34 * (3 * cos(theta) + cos(3 * theta + tFactor)), a34 * (3 * sin(theta) + sin(3 * theta + tFactor)) * zDepth); break;
      case 77: let a35 = r * 0.5; point = createVector(a35 * cos(theta / 3 + tFactor) * cos(theta) * cos(theta), a35 * cos(theta / 3 + tFactor) * sin(theta) * cos(theta) * zDepth); break;
      case 78: let a36 = r * 0.5; point = createVector(a36 * (1 / (theta + tFactor + 0.1)) * cos(theta), a36 * (1 / (theta + tFactor + 0.1)) * sin(theta) * zDepth); break;
      case 79: let a37 = r * 0.5; point = createVector(a37 * cos(theta) / cos(theta + tFactor), a37 * tan(theta + tFactor) * sin(theta) * zDepth); break;
      case 80: let a38 = r * 0.5; point = createVector(a38 * cos(theta) * (1 + sin(4 * theta + tFactor)), a38 * sin(theta) * (1 + sin(4 * theta + tFactor)) * zDepth); break;
      case 81: let a39 = r * 0.6, b39 = r * 0.3; let m2 = sqrt(a39 * a39 + b39 * b39 * cos(theta + tFactor) * cos(theta + tFactor)); point = createVector(m2 * cos(theta), b39 * cos(theta + tFactor) * zDepth); break;
      case 82: let a40 = r * 0.7, b40 = r * 0.5; point = createVector(a40 * cos(theta) * (1 + 0.2 * sin(5 * theta + tFactor)), b40 * sin(theta) * (1 + 0.2 * cos(5 * theta + tFactor)) * zDepth); break;
      case 83: let a41 = r * 0.5; point = createVector(a41 * sin(theta) * (exp(cos(theta + tFactor)) - 2 * cos(4 * theta) - pow(sin(theta / 12), 5)), a41 * cos(theta) * (exp(cos(theta + tFactor)) - 2 * cos(4 * theta) - pow(sin(theta / 12), 5)) * zDepth); break;
      case 84: let a42 = r * 0.5; point = createVector(a42 * (2 * cos(theta + tFactor) + cos(2 * theta + tFactor)), a42 * (2 * sin(theta + tFactor) + sin(2 * theta + tFactor)) * zDepth); break;
      case 85: let a43 = r * 0.5; point = createVector(a43 * sin(theta + tFactor) / (theta + tFactor + 0.1), a43 * cos(theta) / (theta + tFactor + 0.1) * zDepth); break;
      case 86: let a44 = r * 0.5; point = createVector(a44 * (theta / PI) * sin(theta + tFactor), a44 * cos(theta) / (theta / PI + tFactor + 0.1) * zDepth); break;
      case 87: let a45 = r * 0.5, n45 = floor(param2 + 0.5); point = createVector(a45 * pow(abs(cos(theta + tFactor)), 2/n45) * cos(theta), a45 * pow(abs(sin(theta + tFactor)), 2/n45) * sin(theta) * zDepth); break;
      case 88: point = createVector(r * sin(5 * theta + tFactor * 0.7) * cos(theta * param1), r * sin(6 * theta - tFactor * 0.8) * sin(theta * param2) * zDepth); break;
      case 89: let a46 = r * 0.5, n46 = floor(param1 + 0.5); let k46 = n46 * theta + tFactor; point = createVector(a46 * sin(n46 * k46) * cos(k46), a46 * sin(n46 * k46) * sin(k46) * zDepth); break;
      case 90: let s2 = theta * 0.4 + tFactor; point = createVector(r * 0.4 * cos(s2 * s2 + tFactor) * (1 + 0.3 * sin(6 * theta)), r * 0.4 * sin(s2 * s2 + tFactor) * (1 + 0.3 * cos(6 * theta)) * zDepth); break;
      case 91: let a47 = r * 0.5; point = createVector(a47 * (theta - sin(theta + tFactor) + 0.2 * sin(5 * theta)), a47 * (1 - cos(theta + tFactor) + 0.2 * cos(5 * theta)) * zDepth); break;
      case 92: let a48 = r * 0.5; point = createVector(a48 * (1 + sin(theta + tFactor)) * cos(theta), a48 * (1 + sin(theta + tFactor)) * sin(theta) * zDepth); break;
      case 93: let a49 = r * 0.5; point = createVector(a49 * pow(cos(theta + tFactor), 5) * cos(theta), a49 * pow(sin(theta + tFactor), 5) * sin(theta) * zDepth); break;
      case 94: let a50 = r * 0.5; point = createVector(a50 * (2 * cos(theta + tFactor) - cos(2 * theta + tFactor * 1.5)), a50 * (2 * sin(theta + tFactor) + sin(2 * theta + tFactor * 1.5)) * zDepth); break;
      case 95: let a51 = r * 0.5; point = createVector(a51 * (3 * cos(theta) - cos(5 * theta + tFactor)), a51 * (3 * sin(theta) - sin(5 * theta + tFactor)) * zDepth); break;
      case 96: let a52 = r * 0.6, b52 = r * 0.4; point = createVector(a52 * (1 + cos(theta + tFactor)) * cos(theta), b52 * (1 + cos(theta + tFactor)) * sin(theta) * zDepth); break;
      case 97: let a53 = r * 0.5; point = createVector(a53 * 3 * sin(theta) * cos(theta + tFactor) / (1 + sin(theta + tFactor)), a53 * 3 * sin(theta) * sin(theta + tFactor) / (1 + sin(theta + tFactor)) * zDepth); break;
      case 98: let a54 = r * 0.5; point = createVector(a54 * (cos(theta) + log(tan(theta / 2 + tFactor * 0.2))), a54 * sin(theta) * (1 + 0.2 * sin(5 * theta + tFactor)) * zDepth); break;
      case 99: let a55 = r * 0.5, b55 = r * 0.6; point = createVector(a55 * cos(theta) + b55 * sin(theta + tFactor) / cos(theta + tFactor), a55 * sin(theta) + b55 * sin(theta + tFactor) * sin(theta) * zDepth); break;
      case 100: // New: 3D spiral
        let spiral3d = r * (0.4 + 0.3 * noise(theta * 0.5 + t));
        point = createVector(
          spiral3d * cos(theta) * (1 + 0.3 * sin(5 * theta + t)),
          spiral3d * sin(theta) * (1 + 0.3 * cos(5 * theta - t)) * zDepth
        );
        break;
      case 101: // New: Fractal wave
        let wave = r * (0.5 + 0.3 * noise(theta * 2 + t * 0.2));
        point = createVector(
          wave * cos(theta) * (1 + 0.4 * sin(7 * theta + t * 0.3)),
          wave * sin(theta) * (1 + 0.4 * cos(7 * theta - t * 0.3)) * zDepth
        );
        break;
      case 102: // New: 3D twisted torus
         torus = r * (0.5 + 0.2 * sin(theta * 4 + t));
        point = createVector(
          torus * cos(theta) + r/4 * sin(6 * theta + t),
          torus * sin(theta) - r/4 * cos(6 * theta - t) * zDepth
        );
        break;
      case 103: // New: Fractal star
         star = r * (0.4 + 0.3 * sin(theta * 5 + t * 0.5));
        point = createVector(
          star * cos(theta) * (1 + 0.3 * noise(theta * 3 + t)),
          star * sin(theta) * (1 + 0.3 * noise(theta * 3 - t)) * zDepth
        );
        break;
        default:
         
     n = floor(random(3, 8));
        let scale = r * (0.4 + 0.6 * noise(theta * 0.5 + t + (type || 0)));
        let fractalMod = 0.3 * noise(theta * 2 + t * 0.2) + 0.2 * sin(n * theta + tFactor);
        point = createVector(
          scale * cos(theta) * (1 + fractalMod * cos(7 * theta + t * 0.3)),
          scale * sin(theta) * (1 + fractalMod * sin(7 * theta - t * 0.3)) * zDepth
        );
    }

    if (reflectionFlip) {
      point.y = -point.y;
    }

    return point;
  } catch(e) {
    return createVector(r * cos(theta), r * sin(theta) * (0.5 + 0.5 * sin(theta + t * 0.1)));
  }
    
}

function randomizePalette(curveIndex) {
  if (curveIndex % colorPalettes.length !== 7 && curveIndex % colorPalettes.length !== 8) {
    let baseHue = random(360);
    colorPalettes[curveIndex % colorPalettes.length] = [
      baseHue,
      (baseHue + 120) % 360, // Triadic
      (baseHue + 240) % 360  // Triadic
    ];
  }
  reflectionFlip = random() > 0.5;
  usePlasmaColor = random() > 0.3;
}



function draw() {
  background(0, 0.05 * fadeFactor);
  
  if (width !== windowWidth || height !== windowHeight) {
    resizeCanvas(windowWidth, windowHeight);
    maxRadius = min(width, height) * 0.45;
    minRadius = maxRadius * 0.1;
  }
  
  if (millis() - lastChangeTime >  5005) {
    transitionProgress += 0.007;
    if (transitionProgress >= 1) {
      transitionProgress = 0;
      currentCurve = nextCurve;
      nextCurve = (nextCurve + floor(random(1, 7))) % 100;
      prevPalettes[currentCurve % colorPalettes.length] = [...colorPalettes[currentCurve % colorPalettes.length]];
      randomizePalette(currentCurve);
      lastChangeTime = millis();
    }
  }
  
  translate(width/2, height/2);
  let baseScale = min(width, height) / 600;
  scale(baseScale);
  
  drawingContext.filter = 'blur(2px)'; // Apply glow effect
  drawAdditionalCurves();
  drawingContext.filter = 'none'; // Reset filter for main curves
  
  if (transitionProgress > 0) {
    drawCurveType(currentCurve, 1 - transitionProgress);
    drawCurveType(nextCurve, transitionProgress);
  } else {
    drawCurveType(currentCurve, 1);
  }
  
  drawParametricCurve();
  drawingContext.filter = 'blur(2px)'; // Glow for particles
  drawParticles();
  drawingContext.filter = 'none';
  t += animationSpeed;
}





///////////////////////////////////////////////////////////////////////////









function mouseMoved() {
  if (mouseInfluence) {
    // Add particles at mouse position
    if (frameCount % 5 === 0) {
      let p = createParticle();
      p.pos.x = mouseX - width/2;
      p.pos.y = mouseY - height/2;
      particles.push(p);
    }
    
    // Add ripple at mouse position
    for (let ripple of ripples) {
      if (ripple.alpha <= 0) {
        ripple.x = mouseX - width/2;
        ripple.y = mouseY - height/2;
        ripple.size = 5;
        ripple.alpha = 100;
        break;
      }
    }
  }
}

function keyPressed() {
  if (key === ' ') {
    currentCurve = nextCurve;
    nextCurve = floor(random(104));
    transitionProgress = 0;
    lastChangeTime = millis();
    prevPalettes[currentCurve % colorPalettes.length] = [...colorPalettes[currentCurve % colorPalettes.length]];
    randomizePalette(currentCurve);
  } else if (key === '+') {
    animationSpeed = constrain(animationSpeed + 0.005, 0.01, 0.05);
  } else if (key === '-') {
    animationSpeed = constrain(animationSpeed - 0.005, 0.01, 0.05);
  } else if (key === 'b' || key === 'B') {
    fadeFactor = constrain(fadeFactor + (key === 'b' ? -0.2 : 0.2), 0.2, 2);
  } else if (key === 'p' || key === 'P') {
    param1 = constrain(param1 + (key === 'p' ? 0.1 : -0.1), 0.1, 5);
    param2 = constrain(param2 + (key === 'p' ? 0.1 : -0.1), 0.1, 5);
  } else if (key === 'c' || key === 'C') {
    centralScaling = !centralScaling;
  } else if (key === 't') {
    showParticleTrails = !showParticleTrails;
  } else if (key === 'n') {
    showCosmicNoise = !showCosmicNoise;
  } else if (key === 'l') {
    showLightRays = !showLightRays;
  } else if (key === 'f') {
    showLensFlares = !showLensFlares;
  } else if (key === 'g') {
    showFractalOverlay = !showFractalOverlay;
  } else if (key === 'v') {
    showVoronoi = !showVoronoi;
  } else if (key === 's') {
    showSacredGeometry = !showSacredGeometry;
  } else if (key === 'm') {
    showMorphingGrid = !showMorphingGrid;
  } else if (key === 'k') {
    kaleidoscopeMode = !kaleidoscopeMode;
  } else if (key === 'u') {
    tunnelEffect = !tunnelEffect;
  } else if (key === 'r') {
    showRipples = !showRipples;
  } else if (key === 'i') {
    mouseInfluence = !mouseInfluence;
  } else if (key === 'a') {
    audioReactive = !audioReactive;
    if (audioReactive && !mic) {
      mic = new p5.AudioIn();
      mic.start();
      fft = new p5.FFT();
      fft.setInput(mic);
    }
  } else if (key === 'o') {
    showBloom = !showBloom;
  } else if (key === 'h') {
    showChromaticAberration = !showChromaticAberration;
  } else if (key === ';') {
    showFilmGrain = !showFilmGrain;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}