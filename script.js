const imageLoader = document.getElementById('imageLoader');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');
const colorSwatch = document.getElementById('colorSwatch');
const colorValues = document.getElementById('colorValues');
const coordinatesDisplay = document.getElementById('coordinates');
const copyHexBtn = document.getElementById('copyHex');
const copyRGBBtn = document.getElementById('copyRGB');
const copyHSLBtn = document.getElementById('copyHSL');
const historyContainer = document.getElementById('history');
const loader = document.getElementById('loader');
let img = new Image();
const colorHistory = [];
ctx.imageSmoothingEnabled = false;

let selectedHex = null;
let selectedRGB = null;
let selectedHSL = null;

imageLoader.addEventListener('change', handleImage, false);
function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    loader.classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = function(event) {
        img = new Image();
        img.onload = function() {
            loader.classList.add('hidden');
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

imageCanvas.addEventListener('click', function(e) {
    if (!img || !img.width || !img.height) return;
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= imageCanvas.width || y >= imageCanvas.height) {
        alert('Clicked outside the image area.');
        return;
    }
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixelData;
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    selectedHex = hex;
    selectedRGB = `RGB: (${r}, ${g}, ${b})`;
    selectedHSL = `HSL: (${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    colorSwatch.style.backgroundColor = hex;
    colorValues.innerHTML = `
        <span class="block"><strong>HEX:</strong> ${hex}</span>
        <span class="block"><strong>RGB:</strong> (${r}, ${g}, ${b})</span>
        <span class="block"><strong>HSL:</strong> (${hsl.h}, ${hsl.s}%, ${hsl.l}%)</span>
    `;
    coordinatesDisplay.textContent = `Coordinates: (${x}, ${y})`;
    addToHistory(hex);
});

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d/(2 - max - min) : d/(max+min);
        switch (max) {
            case r: h = (g - b)/d + (g < b ? 6:0); break;
            case g: h = (b - r)/d + 2; break;
            case b: h = (r - g)/d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

copyHexBtn.addEventListener('click', (e) => {
    if (selectedHex) {
        copyToClipboard(selectedHex, 'HEX');
    } else {
        alert('No color selected to copy.');
    }
});

copyRGBBtn.addEventListener('click', (e) => {
    if (selectedRGB) {
        copyToClipboard(selectedRGB, 'RGB');
    } else {
        alert('No color selected to copy.');
    }
});

copyHSLBtn.addEventListener('click', (e) => {
    if (selectedHSL) {
        copyToClipboard(selectedHSL, 'HSL');
    } else {
        alert('No color selected to copy.');
    }
});

function copyToClipboard(text, format) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Code copied with code details: ${format} value: ${text}`);
    }).catch(err => {
        alert('Failed to copy!');
    });
}

function addToHistory(hex) {
    if (colorHistory.includes(hex)) return;
    colorHistory.unshift(hex);
    if (colorHistory.length > 10) colorHistory.pop();
    renderHistory();
}

function renderHistory() {
    historyContainer.innerHTML = '';
    colorHistory.forEach(hex => {
        const colorDiv = document.createElement('div');
        colorDiv.classList.add('history-color', 'w-10', 'h-10', 'rounded-lg', 'border', 'border-gray-300', 'cursor-pointer', 'shadow-md');
        colorDiv.style.backgroundColor = hex;
        colorDiv.title = hex;
        colorDiv.setAttribute('tabindex', '0');
        colorDiv.addEventListener('click', () => {
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            selectedHex = hex;
            selectedRGB = `RGB: (${rgb.r}, ${rgb.g}, ${rgb.b})`;
            selectedHSL = `HSL: (${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            colorSwatch.style.backgroundColor = hex;
            colorValues.innerHTML = `
                <span class="block"><strong>HEX:</strong> ${hex}</span>
                <span class="block"><strong>RGB:</strong> (${rgb.r}, ${rgb.g}, ${rgb.b})</span>
                <span class="block"><strong>HSL:</strong> (${hsl.h}, ${hsl.s}%, ${hsl.l}%)</span>
            `;
            coordinatesDisplay.textContent = `Coordinates: N/A`;
        });
        colorDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                colorDiv.click();
            }
        });
        historyContainer.appendChild(colorDiv);
    });
}

const uploadLabel = document.querySelector('label[for="imageLoader"]');
uploadLabel.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        imageLoader.click();
    }
});
