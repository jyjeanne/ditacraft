// Trace resources/ditacraft-logo.png (256 × 256, the logo on a flat #070B16 square) into an SVG
// with vector edges and the original colours:
// - shape: the logo's coverage (red channel: every logo colour has R ≥ ~180, the background 7),
//   upscaled ×8 with Catmull-Rom and traced at 50 % by potrace → clip path (holes = the dark gaps);
// - eye: the white (blue channel) traced the same way → a white path on top;
// - fill: the original pixels, the solid ones kept and their colours spread over the anti-aliased
//   edge and the eye, so the crisp clip shows no dark or light fringe; transparent background.
//
// Usage: node scripts/cover/trace-logo.js [logo.png] [out.svg]
//   (defaults: resources/ditacraft-logo.png → resources/ditacraft-logo.svg)
// Needs potrace and pngjs, which are not project dependencies:
//   npm install --no-save potrace@2 pngjs@7
// Then re-render the cover (node scripts/cover/render.js) and rebuild the user guide.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { Potrace } = require('potrace');

const REPO = path.resolve(__dirname, '..', '..');
const [srcPath = path.join(REPO, 'resources', 'ditacraft-logo.png'), outPath = path.join(REPO, 'resources', 'ditacraft-logo.svg')] = process.argv.slice(2);
const src = PNG.sync.read(fs.readFileSync(srcPath));
const W = src.width, H = src.height;
const S = 8;                      // trace resolution: 2048 × 2048
const at = (x, y, c) => src.data[((Math.min(H - 1, Math.max(0, y)) * W) + Math.min(W - 1, Math.max(0, x))) * 4 + c];

const coverage = (x, y) => Math.min(1, Math.max(0, (at(x, y, 0) - 7) / 217));   // red channel
const whiteness = (x, y) => Math.min(1, Math.max(0, (at(x, y, 2) - 70) / 185)); // blue channel

// Catmull-Rom 2D upscale of a scalar field, sampled at the upscaled pixel centres.
function upscale(field) {
    const w = W * S, h = H * S, out = new Float32Array(w * h);
    const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    for (let Y = 0; Y < h; Y++) {
        const sy = (Y + 0.5) / S - 0.5, y0 = Math.floor(sy), ty = sy - y0;
        for (let X = 0; X < w; X++) {
            const sx = (X + 0.5) / S - 0.5, x0 = Math.floor(sx), tx = sx - x0;
            const rows = [];
            for (let j = -1; j <= 2; j++) {
                rows.push(cr(field(x0 - 1, y0 + j), field(x0, y0 + j), field(x0 + 1, y0 + j), field(x0 + 2, y0 + j), tx));
            }
            out[Y * w + X] = cr(rows[0], rows[1], rows[2], rows[3], ty);
        }
    }
    return out;
}

// A binary PNG for potrace: foreground (value ≥ 0.5) black on white.
function mask(values) {
    const w = W * S, h = H * S, png = new PNG({ width: w, height: h });
    for (let i = 0; i < w * h; i++) {
        const v = values[i] >= 0.5 ? 0 : 255;
        png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = v;
        png.data[i * 4 + 3] = 255;
    }
    return PNG.sync.write(png);
}

function trace(buffer) {
    return new Promise((resolve, reject) => {
        const p = new Potrace({ turdSize: 4 * S, optCurve: true, optTolerance: 0.2, alphaMax: 1, threshold: 128 });
        p.loadImage(buffer, (err) => {
            if (err) { return reject(err); }
            const tag = p.getPathTag('#000');
            resolve(/ d="([^"]+)"/.exec(tag)[1]);
        });
    });
}

// The fill: solid logo pixels kept, their colours spread outward (and over the eye) in layers.
function fill() {
    const png = new PNG({ width: W, height: H });
    const rgb = new Float32Array(W * H * 3), set = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            // solid: logo colours (orange to red) and the eye's white, not the anti-aliased edges
            const white = at(x, y, 0) > 220 && at(x, y, 1) > 220 && at(x, y, 2) > 220;
            if (white || (at(x, y, 0) > 170 && at(x, y, 2) < 100)) {
                for (let c = 0; c < 3; c++) { rgb[i * 3 + c] = at(x, y, c); }
                set[i] = 1;
            }
        }
    }
    for (let layer = 0; layer < 12; layer++) {
        const next = [];
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const i = y * W + x;
                if (set[i]) { continue; }
                let n = 0; const sum = [0, 0, 0];
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const xx = x + dx, yy = y + dy;
                        if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < H && set[yy * W + xx] === 1) {
                            const j = yy * W + xx; n++;
                            for (let c = 0; c < 3; c++) { sum[c] += rgb[j * 3 + c]; }
                        }
                    }
                }
                if (n) { next.push([i, sum.map((s) => s / n)]); }
            }
        }
        for (const [i, c] of next) { rgb.set(c, i * 3); set[i] = 2; }
        for (let i = 0; i < W * H; i++) { if (set[i] === 2) { set[i] = 1; } }
    }
    for (let i = 0; i < W * H; i++) {
        for (let c = 0; c < 3; c++) { png.data[i * 4 + c] = Math.round(set[i] ? rgb[i * 3 + c] : at(i % W, Math.floor(i / W), c)); }
        png.data[i * 4 + 3] = 255;
    }
    return PNG.sync.write(png);
}

(async () => {
    const shape = await trace(mask(upscale(coverage)));
    const eye = await trace(mask(upscale(whiteness)));
    const fillUri = 'data:image/png;base64,' + fill().toString('base64');
    const size = W * S;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- DITA Craft logo: edges traced from resources/ditacraft-logo.png (potrace), colours from its pixels. Generated by scripts/cover/trace-logo.js. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <clipPath id="ditacraft-logo-shape" clipPathUnits="userSpaceOnUse">
      <path clip-rule="evenodd" d="${shape}"/>
    </clipPath>
  </defs>
  <image width="${size}" height="${size}" preserveAspectRatio="none" clip-path="url(#ditacraft-logo-shape)" href="${fillUri}"/>
  <path fill="#FFFFFF" fill-rule="evenodd" d="${eye}"/>
</svg>
`;
    fs.writeFileSync(outPath, svg);
    console.log(`${outPath}: ${(svg.length / 1024).toFixed(0)} KB; shape path ${(shape.length / 1024).toFixed(0)} KB, eye path ${eye.length} chars`);
})().catch((e) => { console.error(e); process.exit(1); });
