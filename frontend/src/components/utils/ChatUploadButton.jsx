import React, { useRef } from "react";
import { Plus } from "lucide-react";

import './ChatUploadButton.css';

export default function ChatUploadButton({ onFiles, disabled, fileCount }) {
  const inputRef = useRef(null);

  const handleSelect = () => inputRef.current?.click();
  const handleChange = (e) => {
    console.log(onFiles);
    if (onFiles) onFiles(Array.from(e.target.files));
    e.target.value = ""; // reset input
  };

  return (
    <div className="chat-upload-container">
      <div className="upload-button-wrap">
        <button
          type="button"
          onClick={handleSelect}
          disabled={disabled}
          className="chat-upload-button"
          title="Upload file"
        >
          <Plus size={18} />
        </button>
        {fileCount > 0 && <span className="badge">{fileCount}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="chat-upload-input"
        onChange={handleChange}
      />
    </div>
  );
}