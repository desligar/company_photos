const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir);
    console.log('Created thumbnails directory');
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Handle image save
app.post('/save-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        const filename = req.file.originalname;
        const filepath = path.join(thumbnailsDir, filename);

        // Write the file to the thumbnails directory
        fs.writeFileSync(filepath, req.file.buffer);

        res.json({ success: true, filename: `thumbnails/${filename}` });
    } catch (error) {
        console.error('Error saving image:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Open your browser and navigate to http://localhost:3000');
});
