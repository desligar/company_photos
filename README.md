# Image Circle Cropper

A standalone JavaScript application for cropping images into circular selections with automatic resizing.

## Features

- Upload images or load from URL
- Select circular area with click and drag
- Automatic validation (minimum 200x200 pixels)
- Automatic resizing to 400x400 or 200x200 pixels based on selection
- Save processed images to project root

## Installation

```bash
npm install
```

## Usage

```bash
npm run start
```

Then open your browser to http://localhost:3000

## How it works

1. Load an image via URL or file upload
2. Click and drag to select a circular area
3. The circle diameter is constrained to the minimum of image width or height
4. Click "Save Image" to save the processed image
5. Images are automatically resized to 400x400px (or 200x200px if selection is smaller)
6. Saved images appear in the project root directory
