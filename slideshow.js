// Slideshow & Annotation System
// Uses PDF.js for rendering and HTML5 Canvas for annotations

// PDF.js worker source (needed for rendering)
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.2;
let canvas, ctx;
let annotationCanvas, annotationCtx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let slideshowRole = null; // 'instructor' or 'student'
let pdfData = null; // Base64 string

// Initialize the slideshow system
function initSlideshow(role, canvasId, annotationCanvasId) {
    slideshowRole = role;

    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

    // Get elements
    canvas = document.getElementById(canvasId);
    annotationCanvas = document.getElementById(annotationCanvasId);

    if (!canvas || !annotationCanvas) {
        console.error('Canvas elements not found:', canvasId, annotationCanvasId);
        return;
    }

    ctx = canvas.getContext('2d');
    annotationCtx = annotationCanvas.getContext('2d');

    // events for resizing (optional, for responsiveness)
    window.addEventListener('resize', handleResize);

    if (slideshowRole === 'instructor') {
        setupInstructorEvents();
    } else {
        setupStudentEvents();
    }
}

function handleResize() {
    if (pdfDoc) {
        renderPage(pageNum);
    }
}

// ==========================================
// PDF RENDERING
// ==========================================

function loadPDF(base64Data) {
    // Save to local storage for persistence across reloads
    // (In production, this should be uploaded to server)
    try {
        if (base64Data) {
            sessionStorage.setItem('currentPDF', base64Data);
            pdfData = base64Data;
        } else {
            pdfData = sessionStorage.getItem('currentPDF');
        }

        if (!pdfData) return;

        // Convert base64 to Uint8Array
        const pdfDataArray = base64ToUint8Array(pdfData);

        pdfjsLib.getDocument({ data: pdfDataArray }).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            document.getElementById('pageCount').textContent = pdfDoc.numPages;

            // Initial render
            renderPage(pageNum);

            // Broadcast initial state if instructor
            if (slideshowRole === 'instructor') {
                broadcastSlideState();
            }
        });
    } catch (e) {
        console.error('Error loading PDF:', e);
        alert('Error loading PDF. File might be too large for storage.');
    }
}

function renderPage(num) {
    pageRendering = true;

    // Fetch page
    pdfDoc.getPage(num).then(function (page) {
        const viewport = page.getViewport({ scale: scale });

        // Set dimensions for both canvases
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        annotationCanvas.height = viewport.height;
        annotationCanvas.width = viewport.width;

        // Render PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Wait for render to finish
        renderTask.promise.then(function () {
            pageRendering = false;

            // Re-render annotations for this page if they exist
            drawStoredAnnotations(num);

            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counters
    document.getElementById('pageNum').textContent = num;
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    if (slideshowRole === 'instructor') broadcastSlideState();
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    if (slideshowRole === 'instructor') broadcastSlideState();
}

// ==========================================
// INSTRUCTOR EVENTS (Upload & Navigation)
// ==========================================

function setupInstructorEvents() {
    // Annotation drawing events
    annotationCanvas.addEventListener('mousedown', startDrawing);
    annotationCanvas.addEventListener('mousemove', draw);
    annotationCanvas.addEventListener('mouseup', stopDrawing);
    annotationCanvas.addEventListener('mouseout', stopDrawing);

    // File upload
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit warning
                    if (!confirm("File is larger than 2MB. It might fail to sync with students. Continue?")) return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const base64 = e.target.result.split(',')[1];
                    loadPDF(base64);

                    // Save to shared session for students to pick up
                    // Using localStorage 'activeSession' to store a reference or small data
                    // But for the PDF itself, we might need to rely on the students polling or a direct event
                    // For this demo, we'll put the *entire PDF* in localStorage (risky but functional for demo)
                    try {
                        localStorage.setItem('sharedPDF', base64);
                        broadcastSlideState();
                    } catch (err) {
                        alert("PDF too large to share via local storage!");
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// ==========================================
// STUDENT EVENTS (Listening)
// ==========================================

function setupStudentEvents() {
    // Poll for changes (simulating WebSocket)
    setInterval(() => {
        const sharedState = JSON.parse(localStorage.getItem('slideState') || '{}');
        const sharedPDF = localStorage.getItem('sharedPDF');

        // Check for new PDF
        if (sharedPDF && sharedPDF !== pdfData) {
            loadPDF(sharedPDF);
        }

        // Sync Page
        if (sharedState.pageNum && sharedState.pageNum !== pageNum) {
            pageNum = sharedState.pageNum;
            queueRenderPage(pageNum);
        }

        // Sync Annotations (Optimization: only if timestamp changed)
        if (sharedState.annotations) {
            // Redraw specific page annotations
            sessionStorage.setItem(`annotations-${pageNum}`, JSON.stringify(sharedState.annotations));
            drawStoredAnnotations(pageNum);
        }

    }, 1000);
}

// ==========================================
// ANNOTATIONS (Canvas)
// ==========================================

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;

    annotationCtx.beginPath();
    annotationCtx.moveTo(lastX, lastY);
    annotationCtx.lineTo(e.offsetX, e.offsetY);
    annotationCtx.strokeStyle = '#ff0000'; // Default red
    annotationCtx.lineWidth = 3;
    annotationCtx.lineCap = 'round';
    annotationCtx.stroke();

    // Save segment
    saveAnnotationStroke(lastX, lastY, e.offsetX, e.offsetY, '#ff0000');

    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        broadcastSlideState(); // Send annotations to students
    }
}

function saveAnnotationStroke(x1, y1, x2, y2, color) {
    let pageAnnotations = JSON.parse(sessionStorage.getItem(`annotations-${pageNum}`) || '[]');
    pageAnnotations.push({
        type: 'line',
        x1, y1, x2, y2,
        color,
        w: canvas.width, // Store dimensions to scale if needed
        h: canvas.height
    });
    sessionStorage.setItem(`annotations-${pageNum}`, JSON.stringify(pageAnnotations));
}

function drawStoredAnnotations(num) {
    // clear canvas
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    const pageAnnotations = JSON.parse(sessionStorage.getItem(`annotations-${num}`) || '[]');

    pageAnnotations.forEach(ann => {
        if (ann.type === 'line') {
            annotationCtx.beginPath();
            annotationCtx.moveTo(ann.x1, ann.y1);
            annotationCtx.lineTo(ann.x2, ann.y2);
            annotationCtx.strokeStyle = ann.color;
            annotationCtx.lineWidth = 3;
            annotationCtx.lineCap = 'round';
            annotationCtx.stroke();
        }
    });
}

function clearAnnotations() {
    sessionStorage.removeItem(`annotations-${pageNum}`);
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    broadcastSlideState();
}

// ==========================================
// SYNC UTILS
// ==========================================

function broadcastSlideState() {
    const currentState = {
        pageNum: pageNum,
        timestamp: Date.now(),
        annotations: JSON.parse(sessionStorage.getItem(`annotations-${pageNum}`) || '[]')
    };
    localStorage.setItem('slideState', JSON.stringify(currentState));
}

function base64ToUint8Array(base64) {
    const raw = atob(base64);
    const uint8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
}
