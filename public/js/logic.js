// Enhanced Image to PDF Generator - Full Updated JS
// File: imagetopdf_enhanced.js
// Complete implementation matching the provided HTML, with fixes for Sortable index issues,
// event delegation, improved dragleave handling, and full feature set (editing, settings, PDF gen).

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImages: 50,
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    defaultSettings: {
        pageSize: 'a4',
        orientation: 'portrait',
        imageQuality: 0.92,
        margin: 20,
        imagesPerPage: 1,
        filename: 'generated'
    }
};

let state = {
    settings: { ...CONFIG.defaultSettings },
    uploadedImages: [],
    currentEditIndex: -1,
    currentRotation: 0,
    currentFlipH: false,
    currentFlipV: false,
    zoomLevel: 1,
    operationCancelled: false
};

// DOM Elements
const elements = {
    imageUpload: document.getElementById('imageUpload'),
    imagePreview: document.getElementById('imagePreview'),
    pdfPreview: document.getElementById('pdfPreview'),
    generateBtn: document.getElementById('generatePdf'),
    clearBtn: document.getElementById('clearAll'),
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    inlineLoader: document.getElementById('inlineLoader'),
    loaderOverlay: document.getElementById('loaderOverlay'),
    loaderText: document.getElementById('loaderText'),
    loaderSub: document.getElementById('loaderSub'),
    progressFill: document.getElementById('progressFill'),
    cancelBtn: document.getElementById('cancelOp'),
    settingsModal: document.getElementById('settingsModal'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettings: document.getElementById('closeSettings'),
    saveSettingsBtn: document.getElementById('saveSettings'),
    resetSettingsBtn: document.getElementById('resetSettings'),
    editModal: document.getElementById('editModal'),
    closeEdit: document.getElementById('closeEdit'),
    editImage: document.getElementById('editImage'),
    applyEditBtn: document.getElementById('applyEdit'),
    cancelEditBtn: document.getElementById('cancelEdit'),
    zoomInBtn: document.getElementById('zoomIn'),
    zoomOutBtn: document.getElementById('zoomOut'),
    zoomLevelEl: document.getElementById('zoomLevel'),
    notification: document.getElementById('notification')
};

// ---------------------------
// Helper: sanitize data URLs
// Removes any query string appended to a data: URL (e.g. "?t=...")
// ---------------------------
function sanitizeDataUrl(url) {
    if (!url || typeof url !== 'string') return url;
    // If URL starts with data:, strip everything after the base64 part
    // Simpler approach: remove any ? and everything after it
    const q = url.indexOf('?');
    if (q === -1) return url;
    return url.substring(0, q);
}

// Initialize
function init() {
    loadSettings();
    initializeSortable();
    attachEventListeners();
    updateUIState();
}

// Load saved settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('pdfSettings');
    if (saved) {
        try {
            state.settings = { ...CONFIG.defaultSettings, ...JSON.parse(saved) };
            applySettingsToUI();
        } catch (e) {
            console.warn('Failed to parse saved settings, using defaults.', e);
        }
    }
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        const container = document.querySelector('.container');
        if (container) container.classList.add('dark-mode');
        document.querySelectorAll('button').forEach(btn => btn.classList.add('dark-mode'));
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) themeIcon.textContent = '🌕';
    }
}

function saveSettings() {
    localStorage.setItem('pdfSettings', JSON.stringify(state.settings));
}

function applySettingsToUI() {
    const pageSizeEl = document.getElementById('pageSize');
    if (pageSizeEl) pageSizeEl.value = state.settings.pageSize;
    const orientationEl = document.getElementById('orientation');
    if (orientationEl) orientationEl.value = state.settings.orientation;
    const imageQualityEl = document.getElementById('imageQuality');
    if (imageQualityEl) imageQualityEl.value = state.settings.imageQuality;
    const qualityValue = document.getElementById('qualityValue');
    if (qualityValue) qualityValue.textContent = Math.round(state.settings.imageQuality * 100) + '%';
    const marginEl = document.getElementById('margin');
    if (marginEl) marginEl.value = state.settings.margin;
    const imagesPerPageEl = document.getElementById('imagesPerPage');
    if (imagesPerPageEl) imagesPerPageEl.value = state.settings.imagesPerPage;
    const filenameEl = document.getElementById('filename');
    if (filenameEl) filenameEl.value = state.settings.filename;
}

// Initialize Sortable for drag-and-drop reordering
function initializeSortable() {
    if (!elements.imagePreview) return;
    new Sortable(elements.imagePreview, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
            try {
                const movedItem = state.uploadedImages.splice(evt.oldIndex, 1)[0];
                state.uploadedImages.splice(evt.newIndex, 0, movedItem);
                // refresh DOM preview so data-index and listeners match state
                refreshImagePreview();
                showNotification(`Image moved from position ${evt.oldIndex + 1} to ${evt.newIndex + 1}`, 'info');
                console.debug('Sortable reorder - state.uploadedImages length:', state.uploadedImages.length);
            } catch (err) {
                console.error('Error in sortable onEnd:', err);
            }
        }
    });
}

// Event Listeners
function attachEventListeners() {
    // File upload
    elements.imageUpload.addEventListener('change', handleImageUpload);
    elements.browseBtn.addEventListener('click', () => elements.imageUpload.click());

    // Drag and drop
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.dropZone.addEventListener('click', (e) => {
        if (e.target === elements.dropZone || (e.target.closest('.drop-zone-content') && !e.target.closest('#browseBtn'))) {
            elements.imageUpload.click();
        }
    });
    elements.dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            elements.imageUpload.click();
        }
    });

    // Buttons
    elements.generateBtn.addEventListener('click', generatePDF);
    elements.clearBtn.addEventListener('click', clearAll);
    elements.cancelBtn.addEventListener('click', cancelOperation);

    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
        if (window.history.length > 1) window.history.back();
        else window.close();
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Settings modal
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettingsHandler);
    elements.resetSettingsBtn.addEventListener('click', resetSettingsHandler);
    const imgQualityEl = document.getElementById('imageQuality');
    if (imgQualityEl) imgQualityEl.addEventListener('input', (e) => {
        const qv = document.getElementById('qualityValue');
        if (qv) qv.textContent = Math.round(e.target.value * 100) + '%';
    });

    // Edit modal
    elements.closeEdit.addEventListener('click', closeEditModal);
    elements.applyEditBtn.addEventListener('click', applyImageEdit);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');
    const flipH = document.getElementById('flipH');
    const flipV = document.getElementById('flipV');
    if (rotateLeft) rotateLeft.addEventListener('click', () => rotateImage(-90));
    if (rotateRight) rotateRight.addEventListener('click', () => rotateImage(90));
    if (flipH) flipH.addEventListener('click', () => flipImage('horizontal'));
    if (flipV) flipV.addEventListener('click', () => flipImage('vertical'));

    // Zoom controls
    elements.zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
    elements.zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Modal close on outside click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettingsModal();
    });
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!elements.settingsModal.hidden) closeSettingsModal();
            if (!elements.editModal.hidden) closeEditModal();
        }
    });

    // Delegated listener for edit/delete on preview items
    elements.imagePreview.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.index, 10);
        if (Number.isNaN(idx)) {
            console.error('Preview button index is NaN', btn);
            return;
        }

        if (action === 'edit') {
            openEditModal(idx);
        } else if (action === 'delete') {
            deleteImage(idx);
        }
    });
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    // If leaving to an element outside the drop zone, remove class
    const toEl = e.relatedTarget || e.toElement;
    if (!toEl || !elements.dropZone.contains(toEl)) {
        elements.dropZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => CONFIG.supportedFormats.includes(file.type));
    if (files.length > 0) {
        processFiles(files);
    } else {
        showNotification('Please drop valid image files', 'error');
    }
}

// File Upload Handler
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    processFiles(files);
}

function processFiles(files) {
    if (state.uploadedImages.length + files.length > CONFIG.maxImages) {
        showNotification(`Maximum ${CONFIG.maxImages} images allowed`, 'error');
        return;
    }

    let validFiles = 0;
    let invalidFiles = 0;

    files.forEach(file => {
        if (!CONFIG.supportedFormats.includes(file.type)) {
            invalidFiles++;
            return;
        }

        if (file.size > CONFIG.maxFileSize) {
            showNotification(`${file.name} exceeds 10MB limit`, 'error');
            invalidFiles++;
            return;
        }

        validFiles++;
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Create thumbnail for fast preview
                const thumbnailCanvas = document.createElement('canvas');
                const thumbnailCtx = thumbnailCanvas.getContext('2d');
                const maxThumbSize = 120;
                const scale = Math.min(maxThumbSize / img.width, maxThumbSize / img.height, 1);
                thumbnailCanvas.width = Math.round(img.width * scale);
                thumbnailCanvas.height = Math.round(img.height * scale);
                thumbnailCtx.drawImage(img, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
                const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);

                const cleanSrc = sanitizeDataUrl(e.target.result);

                const imageData = {
                    src: cleanSrc,
                    originalSrc: cleanSrc,
                    thumbnail: thumbnail,
                    name: file.name,
                    width: img.width,
                    height: img.height,
                    rotation: 0,
                    flipH: false,
                    flipV: false
                };

                state.uploadedImages.push(imageData);
                renderImagePreview(imageData, state.uploadedImages.length - 1);
                updateUIState();
            };
            img.src = e.target.result;
        };

        reader.onerror = function(ev) {
            console.error("Error reading file:", ev);
            showNotification(`Error reading ${file.name}`, 'error');
        };

        reader.readAsDataURL(file);
    });

    if (validFiles > 0) {
        showNotification(`${validFiles} image${validFiles > 1 ? 's' : ''} uploaded successfully`, 'success');
    }
    if (invalidFiles > 0) {
        showNotification(`${invalidFiles} file${invalidFiles > 1 ? 's' : ''} skipped`, 'warning');
    }
}

function renderImagePreview(imageData, index) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.dataset.index = index;

    previewItem.innerHTML = `
        <img src="${imageData.src}" alt="${imageData.name}" loading="lazy">
        <div class="preview-overlay">
            <button class="preview-btn edit-btn" data-action="edit" data-index="${index}" aria-label="Edit ${imageData.name}" title="Edit">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="preview-btn delete-btn" data-action="delete" data-index="${index}" aria-label="Delete ${imageData.name}" title="Delete">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
        <div class="preview-info">
            <span class="preview-name" title="${imageData.name}">${truncateFilename(imageData.name)}</span>
            <span class="preview-size">${imageData.width} × ${imageData.height}</span>
        </div>
    `;

    elements.imagePreview.appendChild(previewItem);
}

function truncateFilename(name, maxLength = 15) {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    return nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...' + ext;
}

function deleteImage(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.uploadedImages.length) return;
    if (confirm('Delete this image?')) {
        state.uploadedImages.splice(index, 1);
        refreshImagePreview();
        updateUIState();
        showNotification('Image deleted', 'info');
    }
}

function refreshImagePreview() {
    elements.imagePreview.innerHTML = '';
    state.uploadedImages.forEach((img, idx) => renderImagePreview(img, idx));
}

function clearAll() {
    if (state.uploadedImages.length === 0) return;

    if (confirm('Clear all images?')) {
        state.uploadedImages = [];
        elements.imagePreview.innerHTML = '';
        elements.pdfPreview.innerHTML = '';
        elements.imageUpload.value = '';
        updateUIState();
        showNotification('All images cleared', 'info');
    }
}

function updateUIState() {
    const hasImages = state.uploadedImages.length > 0;
    elements.generateBtn.disabled = !hasImages;
    elements.clearBtn.disabled = !hasImages;

    if (hasImages) {
        elements.dropZone.classList.add('has-images');
    } else {
        elements.dropZone.classList.remove('has-images');
    }
}

// Edit Modal Functions
function openEditModal(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.uploadedImages.length) return;
    state.currentEditIndex = index;
    const imageData = state.uploadedImages[index];

    // sanitize before loading into edit image (in case older versions have ?t)
    const cleanSrc = sanitizeDataUrl(imageData.src || imageData.originalSrc || '');
    elements.editImage.src = cleanSrc;
    state.currentRotation = imageData.rotation || 0;
    state.currentFlipH = imageData.flipH || false;
    state.currentFlipV = imageData.flipV || false;

    applyImageTransform();
    elements.editModal.hidden = false;
    elements.editModal.style.display = 'flex';
    const editTitle = document.getElementById('editTitle');
    if (editTitle) editTitle.textContent = `Edit: ${imageData.name}`;
    elements.closeEdit.focus();
}

function closeEditModal() {
    elements.editModal.hidden = true;
    elements.editModal.style.display = 'none';
    state.currentEditIndex = -1;
    state.currentRotation = 0;
    state.currentFlipH = false;
    state.currentFlipV = false;
    elements.editImage.style.transform = '';
}

function rotateImage(degrees) {
    state.currentRotation = (state.currentRotation + degrees) % 360;
    if (state.currentRotation < 0) state.currentRotation += 360;
    applyImageTransform();
}

function flipImage(direction) {
    if (direction === 'horizontal') state.currentFlipH = !state.currentFlipH;
    else state.currentFlipV = !state.currentFlipV;
    applyImageTransform();
}

function applyImageTransform() {
    const scaleX = state.currentFlipH ? -1 : 1;
    const scaleY = state.currentFlipV ? -1 : 1;
    elements.editImage.style.transform = `rotate(${state.currentRotation}deg) scale(${scaleX}, ${scaleY})`;
}

function applyImageEdit() {
    if (state.currentEditIndex === -1) return;

    const imageData = state.uploadedImages[state.currentEditIndex];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Ensure we load a clean data URL (strip any stray query string)
    img.onload = function() {
        // compute canvas size based on rotation
        const rot = state.currentRotation % 360;
        const absRot = (rot + 360) % 360;
        if (absRot === 90 || absRot === 270) {
            canvas.width = img.height;
            canvas.height = img.width;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        ctx.save();
        // move origin to center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((state.currentRotation * Math.PI) / 180);
        ctx.scale(state.currentFlipH ? -1 : 1, state.currentFlipV ? -1 : 1);
        // draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Update metadata (IMPORTANT: no '?t=' appended - use a clean data URL)
        const dataUrl = canvas.toDataURL('image/jpeg', state.settings.imageQuality);
        imageData.src = sanitizeDataUrl(dataUrl);
        imageData.width = canvas.width;
        imageData.height = canvas.height;
        imageData.rotation = state.currentRotation;
        imageData.flipH = state.currentFlipH;
        imageData.flipV = state.currentFlipV;

        refreshImagePreview();
        closeEditModal();
        showNotification('Changes applied', 'success');
    };

    img.onerror = function(err) {
        console.error('Error loading image for edit apply:', err);
        showNotification('Failed to apply changes', 'error');
    };

    img.src = sanitizeDataUrl(imageData.src || imageData.originalSrc || '');
}

// Settings Modal Functions
function openSettings() {
    applySettingsToUI();
    elements.settingsModal.hidden = false;
    elements.settingsModal.style.display = 'flex';
    elements.closeSettings.focus();
}

function closeSettingsModal() {
    elements.settingsModal.hidden = true;
    elements.settingsModal.style.display = 'none';
}

function saveSettingsHandler() {
    const pageSize = document.getElementById('pageSize').value;
    const orientation = document.getElementById('orientation').value;
    const imageQuality = parseFloat(document.getElementById('imageQuality').value);
    const margin = parseInt(document.getElementById('margin').value, 10);
    const imagesPerPage = parseInt(document.getElementById('imagesPerPage').value, 10);
    const filename = (document.getElementById('filename').value || 'generated').trim();

    state.settings.pageSize = pageSize;
    state.settings.orientation = orientation;
    state.settings.imageQuality = isNaN(imageQuality) ? CONFIG.defaultSettings.imageQuality : imageQuality;
    state.settings.margin = isNaN(margin) ? CONFIG.defaultSettings.margin : margin;
    state.settings.imagesPerPage = isNaN(imagesPerPage) ? CONFIG.defaultSettings.imagesPerPage : imagesPerPage;
    state.settings.filename = filename || CONFIG.defaultSettings.filename;

    saveSettings();
    closeSettingsModal();
    showNotification('Settings saved', 'success');
}

function resetSettingsHandler() {
    state.settings = { ...CONFIG.defaultSettings };
    applySettingsToUI();
    saveSettings();
    showNotification('Settings reset', 'success');
}

// PDF Generation
async function generatePDF() {
    if (state.uploadedImages.length === 0) {
        showNotification('Please upload at least one image', 'error');
        return;
    }

    state.operationCancelled = false;

    try {
        showInlineLoader();
        showLoader('Starting PDF generation', 'Initializing...', 3);

        const { jsPDF } = window.jspdf;

        const pageSizes = {
            a4: [595.28, 841.89],
            letter: [612, 792],
            legal: [612, 1008],
            a3: [841.89, 1190.55]
        };

        const chosen = pageSizes[state.settings.pageSize] || pageSizes.a4;
        const [width, height] = chosen;
        const pageWidth = state.settings.orientation === 'portrait' ? width : height;
        const pageHeight = state.settings.orientation === 'portrait' ? height : width;

        const pdf = new jsPDF(state.settings.orientation, 'pt', state.settings.pageSize);
        const margin = state.settings.margin;
        const imagesPerPage = state.settings.imagesPerPage;

        let pageCount = 0;

        for (let i = 0; i < state.uploadedImages.length; i += imagesPerPage) {
            if (state.operationCancelled) throw new Error('Operation cancelled');

            const imagesInThisPage = state.uploadedImages.slice(i, i + imagesPerPage);
            const progress = Math.round((i / state.uploadedImages.length) * 90);

            updateLoader(progress, `Processing page ${pageCount + 1}`, `Images ${i + 1}-${Math.min(i + imagesPerPage, state.uploadedImages.length)} of ${state.uploadedImages.length}`);

            if (pageCount > 0) pdf.addPage();

            await processImagesForPage(pdf, imagesInThisPage, pageWidth, pageHeight, margin, imagesPerPage);

            pageCount++;
            await new Promise(r => setTimeout(r, 20));
        }

        if (state.operationCancelled) {
            hideLoader();
            hideInlineLoader();
            return;
        }

        updateLoader(92, 'Finalizing PDF', 'Building output...');
        await new Promise(r => setTimeout(r, 100));

        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        updateLoader(95, 'Preparing preview', 'Opening preview...');
        elements.pdfPreview.innerHTML = `<iframe src="${blobUrl}" width="100%" height="100%" title="PDF Preview"></iframe>`;

        elements.zoomInBtn.disabled = false;
        elements.zoomOutBtn.disabled = false;

        updateLoader(98, 'Downloading', 'Saving file...');
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${state.settings.filename}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        updateLoader(100, 'Complete', 'PDF generated successfully');

        setTimeout(() => {
            hideLoader();
            hideInlineLoader();
            showNotification('PDF generated successfully!', 'success');
        }, 800);

    } catch (error) {
        console.error('Error generating PDF:', error);
        hideLoader();
        hideInlineLoader();

        if (error.message === 'Operation cancelled') showNotification('Operation cancelled', 'info');
        else showNotification('Error generating PDF', 'error');
    }
}

async function processImagesForPage(pdf, images, pageWidth, pageHeight, margin, imagesPerPage) {
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);

    if (imagesPerPage === 1) {
        await addImageToPDF(pdf, images[0], margin, margin, availableWidth, availableHeight);
    } else if (imagesPerPage === 2) {
        const imgHeight = (availableHeight / 2) - 5;
        for (let i = 0; i < images.length; i++) {
            const yPos = margin + (i * (imgHeight + 10));
            await addImageToPDF(pdf, images[i], margin, yPos, availableWidth, imgHeight);
        }
    } else if (imagesPerPage === 4) {
        const imgWidth = (availableWidth / 2) - 5;
        const imgHeight = (availableHeight / 2) - 5;
        for (let i = 0; i < images.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xPos = margin + (col * (imgWidth + 10));
            const yPos = margin + (row * (imgHeight + 10));
            await addImageToPDF(pdf, images[i], xPos, yPos, imgWidth, imgHeight);
        }
    }
}

async function addImageToPDF(pdf, imageData, x, y, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const imgWidth = img.width;
                const imgHeight = img.height;

                const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
                const scaledWidth = Math.max(1, imgWidth * scaleFactor);
                const scaledHeight = Math.max(1, imgHeight * scaleFactor);

                const xOffset = x + (maxWidth - scaledWidth) / 2;
                const yOffset = y + (maxHeight - scaledHeight) / 2;

                // Use higher resolution canvas for better PDF image quality
                canvas.width = Math.round(scaledWidth * 2);
                canvas.height = Math.round(scaledHeight * 2);
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('Canvas toBlob failed'));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            pdf.addImage(e.target.result, 'JPEG', xOffset, yOffset, scaledWidth, scaledHeight);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', state.settings.imageQuality);

            } catch (err) {
                reject(err);
            }
        };
        img.onerror = function(err) {
            reject(err);
        };
        // ensure src is clean
        img.src = sanitizeDataUrl(imageData.src);
    });
}

// Loader Functions
function showInlineLoader() {
    elements.generateBtn.classList.add('hidden');
    elements.inlineLoader.classList.remove('hidden');
    elements.clearBtn.disabled = true;
    elements.imageUpload.disabled = true;
}

function hideInlineLoader() {
    elements.generateBtn.classList.remove('hidden');
    elements.inlineLoader.classList.add('hidden');
    elements.clearBtn.disabled = false;
    elements.imageUpload.disabled = false;
}

function showLoader(title = 'Processing...', sub = '', pct = 0) {
    elements.loaderText.textContent = title;
    elements.loaderSub.textContent = sub;
    elements.progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elements.loaderOverlay.style.display = 'flex';
    elements.generateBtn.disabled = true;
    elements.clearBtn.disabled = true;
    elements.imageUpload.disabled = true;
}

function updateLoader(pct, title, sub) {
    if (title) elements.loaderText.textContent = title;
    if (sub) elements.loaderSub.textContent = sub;
    elements.progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
}

function hideLoader() {
    elements.loaderOverlay.style.display = 'none';
    elements.progressFill.style.width = '0%';
    elements.generateBtn.disabled = false;
    elements.clearBtn.disabled = false;
    elements.imageUpload.disabled = false;
}

function cancelOperation() {
    state.operationCancelled = true;
    hideLoader();
    hideInlineLoader();
    showNotification('Operation cancelled', 'info');
}

// Zoom Functions
function adjustZoom(delta) {
    state.zoomLevel = Math.max(0.5, Math.min(2, state.zoomLevel + delta));
    elements.zoomLevelEl.textContent = Math.round(state.zoomLevel * 100) + '%';
    const iframe = elements.pdfPreview.querySelector('iframe');
    if (iframe) {
        iframe.style.transform = `scale(${state.zoomLevel})`;
        iframe.style.transformOrigin = 'top left';
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const container = document.querySelector('.container');
    if (container) container.classList.toggle('dark-mode');
    document.querySelectorAll('button').forEach(btn => btn.classList.toggle('dark-mode'));

    const isDark = document.body.classList.contains('dark-mode');
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) themeIcon.textContent = isDark ? '🌕' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Notification System
function showNotification(message, type = 'info') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.hidden = false;

    clearTimeout(showNotification._hideTimeout);
    showNotification._hideTimeout = setTimeout(() => {
        elements.notification.hidden = true;
    }, 3000);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
            e.preventDefault();
            if (state.uploadedImages.length > 0) generatePDF();
        } else if (e.key === 'o') {
            e.preventDefault();
            elements.imageUpload.click();
        }
    }
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
