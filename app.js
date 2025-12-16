let canvas, ctx, image;
let isDrawing = false;
let isMoving = false;
let circleCenter = null;
let circleRadius = 0;
let dragOffset = { x: 0, y: 0 };

function showError(message) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMsg');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function loadImageFromUrl() {
    const url = document.getElementById('imageUrl').value.trim();
    if (!url) {
        showError('Please enter an image URL');
        return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
        validateAndLoadImage(img);
    };
    
    img.onerror = function() {
        showError('Failed to load image from URL. Make sure the URL is correct and CORS is enabled.');
    };
    
    img.src = url;
}

function loadImageFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            validateAndLoadImage(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function validateAndLoadImage(img) {
    // Check if both dimensions are at least 200px
    if (img.width < 200 || img.height < 200) {
        showError(`Image is too small. Minimum dimensions are 200x200 pixels. Your image is ${img.width}x${img.height}.`);
        return;
    }

    image = img;
    setupCanvas();
    showSuccess('Image loaded successfully! Click and drag to select a circular area.');
}

function setupCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Draw the image
    ctx.drawImage(image, 0, 0);
    
    // Show canvas container
    document.getElementById('canvasContainer').style.display = 'block';
    
    // Set up event listeners
    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
    canvas.onmouseleave = stopDrawing;
}

function startDrawing(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // Check if clicking inside existing circle
    if (circleCenter && circleRadius > 0) {
        const dx = mouseX - circleCenter.x;
        const dy = mouseY - circleCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= circleRadius) {
            // Start moving the circle
            isMoving = true;
            dragOffset = { x: dx, y: dy };
            canvas.style.cursor = 'move';
            return;
        }
    }
    
    // Start drawing new circle
    isDrawing = true;
    circleCenter = {
        x: mouseX,
        y: mouseY
    };
    circleRadius = 0;
}

function draw(e) {
    if (!isDrawing && !isMoving) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    if (isMoving) {
        // Move the circle, keeping it within bounds
        const newX = currentX - dragOffset.x;
        const newY = currentY - dragOffset.y;
        
        // Constrain to canvas bounds
        circleCenter.x = Math.max(circleRadius, Math.min(image.width - circleRadius, newX));
        circleCenter.y = Math.max(circleRadius, Math.min(image.height - circleRadius, newY));
    } else if (isDrawing) {
        // Calculate distance from center
        const dx = currentX - circleCenter.x;
        const dy = currentY - circleCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // The circle diameter should equal the minimum of width or height
        const maxRadius = Math.min(image.width, image.height) / 2;
        circleRadius = Math.min(distance, maxRadius);
    }
    
    drawCircle();
}

function stopDrawing() {
    isDrawing = false;
    isMoving = false;
    canvas.style.cursor = 'crosshair';
}

function drawCircle() {
    // Redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    
    if (!circleCenter || circleRadius === 0) return;
    
    // Draw the circle
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw semi-transparent overlay outside the circle
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the circle area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
}

function resetSelection() {
    circleCenter = null;
    circleRadius = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    document.getElementById('previewSection').style.display = 'none';
}

function getSelectedBackgroundColor() {
    const selected = document.querySelector('input[name="bgColor"]:checked');
    return selected ? selected.value : 'white';
}

function generatePreview() {
    if (!circleCenter || circleRadius === 0) {
        showError('Please select a circular area first by clicking and dragging on the image.');
        return;
    }
    
    const diameter = circleRadius * 2;
    let targetSize;
    
    if (diameter >= 400) {
        targetSize = 400;
    } else if (diameter >= 200) {
        targetSize = 200;
    } else {
        showError('Selected circle is too small. Minimum diameter is 200 pixels.');
        return;
    }
    
    const bgColor = getSelectedBackgroundColor();
    const finalCanvas = createFinalImage(diameter, targetSize, bgColor);
    
    // Show preview
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    previewCanvas.width = targetSize;
    previewCanvas.height = targetSize;
    previewCtx.drawImage(finalCanvas, 0, 0);
    
    document.getElementById('previewSection').style.display = 'block';
    showSuccess(`Preview generated at ${targetSize}x${targetSize}px`);
}

function createFinalImage(diameter, targetSize, bgColor) {
    // Create a temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = diameter;
    tempCanvas.height = diameter;
    
    // Draw the circular portion of the image
    tempCtx.drawImage(
        image,
        circleCenter.x - circleRadius,
        circleCenter.y - circleRadius,
        diameter,
        diameter,
        0,
        0,
        diameter,
        diameter
    );
    
    // Create final canvas for resizing
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    finalCanvas.width = targetSize;
    finalCanvas.height = targetSize;
    
    // Fill with selected background color
    finalCtx.fillStyle = bgColor === 'black' ? '#000000' : '#FFFFFF';
    finalCtx.fillRect(0, 0, targetSize, targetSize);
    
    // Draw the cropped image scaled to target size
    finalCtx.drawImage(tempCanvas, 0, 0, diameter, diameter, 0, 0, targetSize, targetSize);
    
    return finalCanvas;
}

function saveImage() {
    if (!circleCenter || circleRadius === 0) {
        showError('Please select a circular area first by clicking and dragging on the image.');
        return;
    }
    
    // Get filename from input
    let filename = document.getElementById('filename').value.trim();
    if (!filename) {
        showError('Please enter a filename.');
        return;
    }
    
    // Remove .png extension if user added it
    filename = filename.replace(/\.png$/i, '');
    
    // Determine target size (400x400 or 200x200)
    const diameter = circleRadius * 2;
    let targetSize;
    
    if (diameter >= 400) {
        targetSize = 400;
    } else if (diameter >= 200) {
        targetSize = 200;
    } else {
        showError('Selected circle is too small. Minimum diameter is 200 pixels.');
        return;
    }
    
    const bgColor = getSelectedBackgroundColor();
    const finalCanvas = createFinalImage(diameter, targetSize, bgColor);
    
    // Convert to blob and send to server
    finalCanvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, `${filename}.png`);
        formData.append('size', targetSize);
        
        fetch('/save-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess(`Image saved successfully as ${data.filename}`);
                // Reset the page after 1.5 seconds
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showError('Failed to save image: ' + data.error);
            }
        })
        .catch(error => {
            showError('Error saving image: ' + error.message);
        });
    }, 'image/png');
}
