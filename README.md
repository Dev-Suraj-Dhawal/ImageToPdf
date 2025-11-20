# Image to PDF Converter

A modern, web-based tool that allows users to convert multiple images into a single PDF document with advanced features like drag-and-drop uploading, image reordering, editing capabilities, and customizable PDF settings.

## Features

### Core Functionality
- **Drag & Drop Upload**: Easily upload multiple images by dragging and dropping them into the upload area or by clicking to browse files
- **Image Preview**: Visual preview of uploaded images with thumbnails and metadata (dimensions, file name)
- **Image Reordering**: Drag and drop to reorder images before PDF generation
- **PDF Generation**: Convert uploaded images to a single PDF file with customizable settings

### Advanced Features
- **Image Editing**:
  - Rotate images (90° left/right)
  - Flip images horizontally or vertically
  - Zoom in/out for detailed editing
- **Settings Customization**:
  - Page size (A4, Letter, Legal, A3)
  - Orientation (Portrait/Landscape)
  - Image quality (compression level)
  - Margin settings
  - Images per page (1, 2, or 4)
  - Custom filename
- **Progress Tracking**: Real-time progress bar during PDF generation
- **Theme Toggle**: Switch between light and dark modes
- **Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **File Validation**: Supports JPEG, PNG, GIF, and WebP formats with 10MB size limit per file
- **Batch Processing**: Handle up to 50 images simultaneously
- **Client-side Processing**: All image processing and PDF generation happens in the browser
- **Keyboard Shortcuts**: Ctrl+S to generate PDF, Ctrl+O to open file dialog
- **Error Handling**: Comprehensive error messages and validation

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup
1. Clone or download the project files
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and go to `http://localhost:3000`

## Usage

### Basic Workflow
1. **Upload Images**:
   - Drag and drop images into the upload area
   - Or click the upload area to browse and select files
   - Supported formats: JPEG, PNG, GIF, WebP

2. **Reorder Images** (optional):
   - Drag images in the preview area to change their order in the PDF

3. **Edit Images** (optional):
   - Click the edit button on any image preview
   - Use rotation and flip controls to modify the image
   - Adjust zoom level for precise editing

4. **Configure Settings** (optional):
   - Click the settings button to open the configuration modal
   - Adjust page size, orientation, quality, margins, etc.

5. **Generate PDF**:
   - Click the "Convert to PDF" button
   - Monitor progress in the progress bar
   - PDF will automatically download when complete

### Advanced Usage
- **Keyboard Shortcuts**:
  - `Ctrl+S` (or `Cmd+S` on Mac): Generate PDF
  - `Ctrl+O` (or `Cmd+O` on Mac): Open file browser
  - `Escape`: Close modals

- **Settings Persistence**: Your settings are saved locally and will be remembered for future sessions

- **Theme Switching**: Click the theme toggle button to switch between light and dark modes

## Project Structure

```
imagetopdf/
├── server.js              # Express server setup
├── package.json           # Project dependencies and scripts
├── LICENSE                # MIT License
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── public/
    ├── index.html        # Main HTML interface
    ├── css/
    │   └── beauty.css    # Styling and responsive design
    └── js/
        ├── logic.js      # Main application logic
        └── sortable.min.js # Drag-and-drop library
```

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for serving static files

### Frontend
- **HTML5**: Semantic markup and drag-and-drop API
- **CSS3**: Modern styling with gradients, flexbox, and responsive design
- **JavaScript (ES6+)**: Client-side logic and DOM manipulation

### Libraries
- **jsPDF**: PDF generation library
- **Sortable.js**: Drag-and-drop reordering functionality

## API Endpoints

The application serves as a single-page application with the following routes:

- `GET /`: Serves the main application interface
- `GET /*`: Catch-all route that serves the main HTML file (for client-side routing)

## Configuration

### Environment Variables
- `PORT`: Server port (defaults to 3000)

### Application Settings
All user settings are stored locally in the browser's localStorage:
- PDF page size and orientation
- Image quality and compression
- Margin settings
- Images per page
- Output filename
- Theme preference

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Suraj Dhawal**

## Acknowledgments

- jsPDF library for PDF generation capabilities
- Sortable.js for drag-and-drop functionality
- Material Symbols for UI icons
