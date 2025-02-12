const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const previewArea = document.getElementById('previewArea');
const imagePreview = document.getElementById('imagePreview');
const downloadBtn = document.getElementById('downloadBtn');
const compressBtn = document.getElementById('compressBtn');
const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
const modalImage = document.getElementById('modalImage');
const modalImageName = document.getElementById('modalImageName');

const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoomReset = document.getElementById('zoomReset');
const zoomLevel = document.getElementById('zoomLevel');

const fullscreenBtn = document.getElementById('fullscreenBtn');
const modalDialog = document.querySelector('.modal-dialog');
const imageSizeInfo = document.getElementById('imageSizeInfo');

const recentPreviews = document.getElementById('recentPreviews');
const recentPreviewList = document.querySelector('.recent-preview-list');
const savePresetBtn = document.getElementById('savePreset');
const clearHistoryBtn = document.getElementById('clearHistory');

const currentLang = localStorage.getItem('language') || 'vi';
document.documentElement.lang = currentLang;

let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
let lastZoomPoint = { x: 0, y: 0 };

let currentZoom = 1;
const ZOOM_STEP = 0.1;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.5;

let originalImages = [];

const previewCache = new Map();
const MAX_RECENT_PREVIEWS = 8;
let recentPreviewsData = JSON.parse(localStorage.getItem('recentPreviews') || '[]');
let favoritePresets = JSON.parse(localStorage.getItem('favoritePresets') || '[]');

function initLanguageSystem() {
    const currentLang = langUtil.getCurrentLang();
    document.documentElement.lang = currentLang;
    document.querySelector('.current-lang').textContent = currentLang.toUpperCase();
    langUtil.updateTexts();
    
    document.querySelectorAll('.dropdown-menu [data-lang]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.dataset.lang;
            localStorage.setItem('language', lang);
            document.documentElement.lang = lang;
            document.querySelector('.current-lang').textContent = lang.toUpperCase();
            
            document.querySelectorAll('.dropdown-menu [data-lang]').forEach(el => {
                el.classList.toggle('active', el.dataset.lang === lang);
            });
            
            updateUILanguage(lang);
        });
    });
}

function updateUILanguage(lang) {
    const t = translations[lang];
    
    langUtil.updateTexts();
    
    document.querySelector('#dropZone h4').textContent = t.dropText;
    document.querySelector('#dropZone p').textContent = t.orText;
    document.querySelector('#dropZone button').innerHTML = `<i class="bi bi-folder"></i> ${t.selectImages}`;
    
    document.querySelector('.compression-options h5').textContent = t.defaultQuality;
    document.querySelectorAll('.preset-buttons button')[0].textContent = t.highQuality;
    document.querySelectorAll('.preset-buttons button')[1].textContent = t.balanced;
    document.querySelectorAll('.preset-buttons button')[2].textContent = t.smallSize;
    
    compressBtn.innerHTML = `<i class="bi bi-compress"></i> ${t.compress}`;
    downloadBtn.innerHTML = `<i class="bi bi-download"></i> ${t.downloadAll}`;
    
    if (document.querySelector('#previewArea')) {
        document.querySelector('#previewArea h5').textContent = t.previewSection;
        document.querySelector('#clearHistory').textContent = t.clearHistory;
    }

    updateExistingPreviews(t);
}

initLanguageSystem();

function updateExistingPreviews(t) {
    document.querySelectorAll('.preview-info').forEach(info => {
        const sizeTexts = info.querySelectorAll('div');
        if (sizeTexts[1]) {
            const size = sizeTexts[1].textContent.match(/\d+(\.\d+)?\s*KB/)[0];
            sizeTexts[1].textContent = `${t.originalSize}: ${size}`;
        }
        if (sizeTexts[2]) {
            const size = sizeTexts[2].textContent.match(/\d+(\.\d+)?\s*KB/)[0];
            sizeTexts[2].textContent = `${t.compressedSize}: ${size}`;
        }
    });
}

qualityRange.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value;
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

async function handleFiles(files) {
    if (files.length === 0) return;
    
    previewArea.classList.remove('d-none');
    imagePreview.innerHTML = '';
    originalImages = [];
    
    const processQueue = Array.from(files).filter(file => file.type.startsWith('image/')).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const imageData = {
                        img: img,
                        fileName: file.name,
                        fileType: file.type,
                        originalSize: file.size / 1024
                    };
                    originalImages.push(imageData);
                    displayOriginalPreview(img.src, file.name, file.size / 1024);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });

    await Promise.all(processQueue);
}

function displayOriginalPreview(imgSrc, fileName, originalSize) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    const id = `img-${originalImages.length}`;
    
    col.innerHTML = `
        <div class="preview-item">
            <img src="${imgSrc}" alt="${fileName}" class="img-fluid mb-2" onclick="showImagePreview(this.src, '${fileName}')">
            <div class="preview-info">
                <div>${fileName}</div>
                <div>Kích thước gốc: ${originalSize.toFixed(1)} KB (${originalImages[originalImages.length - 1].img.width}×${originalImages[originalImages.length - 1].img.height})</div>
                <div class="quality-control mt-2">
                    <label class="d-flex justify-content-between small">
                        <span>Chất lượng</span>
                        <span class="quality-value">80%</span>
                    </label>
                    <input type="range" class="form-range quality-slider" 
                           min="1" max="100" value="80" data-index="${originalImages.length - 1}">
                </div>
            </div>
        </div>
    `;
    
    imagePreview.appendChild(col);

    const qualitySlider = col.querySelector('.quality-slider');
    const qualityValue = col.querySelector('.quality-value');
    
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });
}

compressBtn.addEventListener('click', async () => {
    if (originalImages.length === 0) return;
    
    const t = translations[currentLang];
    compressBtn.disabled = true;
    compressBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang nén...';
    
    try {
        const containers = imagePreview.children;
        
        for (let i = 0; i < originalImages.length; i++) {
            const container = containers[i];
            const imgData = originalImages[i];
            const qualitySlider = container.querySelector('.quality-slider');
            const quality = parseInt(qualitySlider.value);
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgData.img.src;
            });
            
            const compressedBlob = await compressImage(img, imgData.fileType || 'image/jpeg', quality);
            const compressedUrl = URL.createObjectURL(compressedBlob);
            const compressedSize = compressedBlob.size / 1024;

            container.innerHTML = generateCompressedPreviewHTML(
                compressedUrl,
                imgData.fileName,
                imgData.originalSize,
                compressedSize,
                img.width,
                img.height
            );
            
            img.remove();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error('Error during compression:', error);
        alert(t.error);
    } finally {
        compressBtn.disabled = false;
        compressBtn.innerHTML = '<i class="bi bi-compress"></i> Nén Ảnh';
    }
});

function generateCompressedPreviewHTML(blobUrl, fileName, originalSize, compressedSize, width, height) {
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    return `
        <div class="preview-item">
            <img src="${blobUrl}" alt="${fileName}" class="img-fluid mb-2" onclick="showImagePreview(this.src, '${fileName}')">
            <div class="preview-info">
                <div>${fileName}</div>
                <div>Kích thước gốc: ${originalSize.toFixed(1)} KB</div>
                <div>Kích thước sau nén: ${compressedSize.toFixed(1)} KB (${width}×${height})</div>
                <div class="text-success">Đã giảm: ${savings}%</div>
            </div>
        </div>
    `;
}

async function compressImage(img, fileType, quality) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            
            if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }
            if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.clearRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                fileType,
                quality / 100
            );
        } catch (error) {
            reject(error);
        }
    });
}

async function getCachedPreview(img, quality) {
    const cacheKey = `${img.src}-${quality}`;
    if (previewCache.has(cacheKey)) {
        return previewCache.get(cacheKey);
    }

    const compressedBlob = await compressImage(img, quality);
    const previewUrl = URL.createObjectURL(compressedBlob);
    previewCache.set(cacheKey, {
        url: previewUrl,
        size: compressedBlob.size,
        quality: quality
    });

    addToRecentPreviews({
        url: previewUrl,
        fileName: img.fileName,
        originalSize: img.originalSize,
        compressedSize: compressedBlob.size / 1024,
        quality: quality
    });

    return previewCache.get(cacheKey);
}

function addToRecentPreviews(preview) {
    recentPreviewsData.unshift(preview);
    if (recentPreviewsData.length > MAX_RECENT_PREVIEWS) {
        const removed = recentPreviewsData.pop();
        URL.revokeObjectURL(removed.url);
    }
    localStorage.setItem('recentPreviews', JSON.stringify(recentPreviewsData));
    updateRecentPreviewsUI();
}

function updateRecentPreviewsUI() {
    if (recentPreviewsData.length === 0) {
        recentPreviews.classList.add('d-none');
        return;
    }

    recentPreviews.classList.remove('d-none');
    recentPreviewList.innerHTML = recentPreviewsData.map(preview => `
        <div class="col-md-3">
            <div class="recent-preview-item" onclick="loadRecentPreview('${preview.url}', '${preview.quality}')">
                <img src="${preview.url}" alt="${preview.fileName}">
                <div class="overlay">
                    Quality: ${preview.quality}%<br>
                    Saved: ${((preview.originalSize - preview.compressedSize) / preview.originalSize * 100).toFixed(1)}%
                </div>
            </div>
        </div>
    `).join('');
}

function loadRecentPreview(url, quality) {
    qualityRange.value = quality;
    qualityValue.textContent = quality;
}

function displayPreview(blobUrl, fileName, originalSize, compressedSize) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    col.innerHTML = `
        <div class="preview-item">
            <img src="${blobUrl}" alt="${fileName}" class="img-fluid mb-2" onclick="showImagePreview(this.src, '${fileName}')">
            <div class="preview-info">
                <div>${fileName}</div>
                <div>Original: ${originalSize.toFixed(1)} KB</div>
                <div>Compressed: ${compressedSize.toFixed(1)} KB</div>
                <div class="text-success">Saved: ${savings}%</div>
            </div>
        </div>
    `;
    
    imagePreview.appendChild(col);
}

function updateZoom(newZoom, mouseX, mouseY) {
    const container = document.querySelector('.image-zoom-container');
    const oldZoom = currentZoom;
    currentZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

    if (mouseX !== undefined && mouseY !== undefined) {
        const boundingRect = container.getBoundingClientRect();
        const scrollXRatio = (mouseX - boundingRect.left + container.scrollLeft) / (modalImage.width * oldZoom);
        const scrollYRatio = (mouseY - boundingRect.top + container.scrollTop) / (modalImage.height * oldZoom);

        modalImage.style.transform = `scale(${currentZoom})`;

        const newScrollX = scrollXRatio * modalImage.width * currentZoom - (mouseX - boundingRect.left);
        const newScrollY = scrollYRatio * modalImage.height * currentZoom - (mouseY - boundingRect.top);
        container.scrollTo(newScrollX, newScrollY);
    } else {
        modalImage.style.transform = `scale(${currentZoom})`;
    }

    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
    container.classList.toggle('zoomed', currentZoom > 1);
    updateImageSizeInfo();
}

zoomIn.addEventListener('click', () => {
    updateZoom(currentZoom + ZOOM_STEP);
});

zoomOut.addEventListener('click', () => {
    updateZoom(currentZoom - ZOOM_STEP);
});

zoomReset.addEventListener('click', () => {
    updateZoom(1);
});

modalImage.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        updateZoom(currentZoom + delta, e.clientX, e.clientY);
    }
});

function showImagePreview(src, fileName) {
    modalImage.src = src;
    modalImageName.textContent = fileName;
    currentZoom = 1;
    updateZoom(1);
    document.getElementById('imageModal').classList.remove('fullscreen');
    fullscreenBtn.querySelector('i').classList.replace('bi-fullscreen-exit', 'bi-fullscreen');
    imageModal.show();
}

function toggleFullscreen() {
    const modal = document.getElementById('imageModal');
    modal.classList.toggle('fullscreen');
    fullscreenBtn.querySelector('i').classList.toggle('bi-fullscreen');
    fullscreenBtn.querySelector('i').classList.toggle('bi-fullscreen-exit');
    updateImageSizeInfo();
}

function updateImageSizeInfo() {
    const width = Math.round(modalImage.naturalWidth * currentZoom);
    const height = Math.round(modalImage.naturalHeight * currentZoom);
    imageSizeInfo.textContent = `${width}×${height}px`;
}

const container = document.querySelector('.image-zoom-container');

container.addEventListener('mousedown', (e) => {
    if (currentZoom <= 1) return;
    isDragging = true;
    container.style.cursor = 'grabbing';
    startX = e.pageX - container.offsetLeft;
    startY = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
});

container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const moveX = (x - startX);
    const moveY = (y - startY);
    container.scrollLeft = scrollLeft - moveX;
    container.scrollTop = scrollTop - moveY;
});

container.addEventListener('mouseleave', stopDragging);
container.addEventListener('mouseup', stopDragging);

function stopDragging() {
    isDragging = false;
    container.style.cursor = currentZoom > 1 ? 'move' : 'zoom-in';
}

fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', (e) => {
    if (!imageModal._isShown) return;
    
    switch(e.key) {
        case 'f':
            toggleFullscreen();
            break;
        case 'Escape':
            if (document.getElementById('imageModal').classList.contains('fullscreen')) {
                toggleFullscreen();
                e.stopPropagation();
            }
            break;
    }
});

downloadBtn.addEventListener('click', async () => {
    const images = imagePreview.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i].src);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.download = `compressed_image_${i + 1}.jpg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
});

document.querySelectorAll('.preset-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const quality = btn.dataset.quality;
        qualityRange.value = quality;
        qualityValue.textContent = quality;
        
        document.querySelectorAll('.quality-slider').forEach(slider => {
            slider.value = quality;
            slider.parentElement.querySelector('.quality-value').textContent = `${quality}%`;
        });
    });
});

savePresetBtn.addEventListener('click', () => {
    const quality = qualityRange.value;
    if (!favoritePresets.includes(quality)) {
        favoritePresets.push(quality);
        localStorage.setItem('favoritePresets', JSON.stringify(favoritePresets));
        updateFavoritePresetsUI();
    }
});

clearHistoryBtn.addEventListener('click', () => {
    recentPreviewsData.forEach(preview => URL.revokeObjectURL(preview.url));
    recentPreviewsData = [];
    localStorage.removeItem('recentPreviews');
    updateRecentPreviewsUI();
});

updateRecentPreviewsUI();

document.querySelectorAll('[data-lang]').forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.dataset.lang;
        localStorage.setItem('language', lang);
        updateLanguage(lang);
    });
});

function updateLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = lang;
    
    document.querySelector('h1').textContent = t.title;
    document.querySelector('.subtitle').textContent = t.description;
    
    document.querySelector('#dropZone h4').textContent = t.dropText;
    document.querySelector('#dropZone p').textContent = t.orText;
    document.querySelector('#dropZone button').innerHTML = `<i class="bi bi-folder"></i> ${t.selectImages}`;
    
    document.querySelector('.compression-options h5').textContent = t.defaultQuality;
    document.querySelectorAll('.preset-buttons button')[0].textContent = t.highQuality;
    document.querySelectorAll('.preset-buttons button')[1].textContent = t.balanced;
    document.querySelectorAll('.preset-buttons button')[2].textContent = t.smallSize;
    document.querySelector('.compression-options label.form-label').textContent = t.qualityLabel;
    
    document.querySelector('#compressBtn').innerHTML = `<i class="bi bi-compress"></i> ${t.compress}`;
    document.querySelector('#downloadBtn').innerHTML = `<i class="bi bi-download"></i> ${t.downloadAll}`;
    document.querySelector('#clearHistory').textContent = t.clearHistory;
    
    document.querySelector('#previewArea h5').textContent = t.previewSection;
    
    document.querySelector('#languageDropdown').innerHTML = `<i class="bi bi-globe"></i> ${lang.toUpperCase()}`;
    
    document.querySelectorAll('[data-lang]').forEach(el => {
        el.classList.toggle('active', el.dataset.lang === lang);
    });

    updateExistingPreviews(t);
}

function updateExistingPreviews(translations) {
    document.querySelectorAll('.preview-info').forEach(info => {
        const sizeTexts = info.querySelectorAll('div');
        if (sizeTexts[1]) {
            sizeTexts[1].textContent = sizeTexts[1].textContent.replace(
                /^(Kích thước gốc|Original size):/,
                `${translations.originalSize}:`
            );
        }
        if (sizeTexts[2]) {
            sizeTexts[2].textContent = sizeTexts[2].textContent.replace(
                /^(Kích thước sau nén|Compressed size):/,
                `${translations.compressedSize}:`
            );
        }
    });
}

updateLanguage(currentLang);

function compressIndividualImage(imgSrc, fileName, originalSize, quality, container) {
    const t = translations[currentLang];
    try {
    } catch (error) {
        console.error('Error compressing image:', error);
        alert(t.error);
    }
}

window.addEventListener('unload', () => {
    previewCache.forEach(preview => URL.revokeObjectURL(preview.url));
    recentPreviewsData.forEach(preview => URL.revokeObjectURL(preview.url));
});
