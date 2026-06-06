import React, { useState, useRef } from 'react';
import { UploadCloud, Image, FileImage, X } from 'lucide-react';

function SlipUploadZone({ onFileSelected, selectedFile, existingImageUrl, onRemoveFile }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    }
  };

  const onButtonClick = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  return (
    <div className="form-group">
      <span className="form-label">รูปภาพสลิปโอนเงิน / หลักฐานจ่ายเงิน (Slip Image)</span>
      
      {(selectedFile || existingImageUrl) ? (
        <div className="upload-zone" style={{ borderStyle: 'solid', borderColor: 'hsl(var(--primary) / 0.5)' }}>
          <button 
            type="button" 
            className="remove-upload" 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile();
            }}
            title="ลบรูปภาพสลิป"
          >
            <X size={14} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={selectedFile ? URL.createObjectURL(selectedFile) : existingImageUrl} 
              alt="Slip Preview" 
              className="upload-preview" 
            />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileImage size={14} color="hsl(var(--primary))" />
              {selectedFile ? selectedFile.name : 'สลิปอัปโหลดแล้ว'}
            </span>
          </div>
        </div>
      ) : (
        <div 
          className={`upload-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="file-input" 
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleChange}
          />
          
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%' }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <UploadCloud size={38} className="upload-icon" color="hsl(var(--primary))" />
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              ลากไฟล์รูปภาพมาวางที่นี่ หรือ <span style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>คลิกเพื่อเลือกไฟล์</span>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              รองรับไฟล์รูปภาพ PNG, JPG, JPEG ขนาดไม่เกิน 5MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlipUploadZone;
