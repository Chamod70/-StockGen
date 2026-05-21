import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import './Dropzone.css';

const Dropzone = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.match('image/jpeg') || 
      file.type.match('image/png') || 
      file.type.match('image/webp')
    );

    if (files.length > 0) {
      onFilesAdded(files.slice(0, 5000)); // Limit to 5000
    }
  }, [onFilesAdded]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesAdded(files.slice(0, 5000));
    }
  };

  return (
    <div 
      className={`glass-panel dropzone ${isDragging ? 'dragging' : ''} animate-fade-in`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        multiple 
        accept="image/jpeg, image/png, image/webp" 
        onChange={handleChange}
        className="file-input"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="dropzone-content">
        <div className="icon-wrapper">
          <UploadCloud size={48} className="text-gradient" />
        </div>
        <h3>Drag & Drop Images</h3>
        <p>or click to browse</p>
        <div className="supported-formats">
          <span>JPG</span> • <span>PNG</span> • <span>WEBP</span>
          <br/>
          <small>Max 5000 images</small>
        </div>
      </label>
    </div>
  );
};

export default Dropzone;
