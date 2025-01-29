import React, { useCallback } from 'react';

interface FileUploadProps {
  onUpload: (logFile: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [logFile, setLogFile] = React.useState<File | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (logFile) {
      onUpload(logFile);
    }
  }, [logFile, onUpload]);

  return (
    <form onSubmit={handleSubmit} className="upload-section">
      <h2>Upload Poker Log</h2>
      <div className="file-input-container">
        <div className="file-input-wrapper">
          <label htmlFor="log-file" className="file-button">
            Choose CSV File
          </label>
          <input
            type="file"
            id="log-file"
            accept=".csv"
            onChange={(e) => setLogFile(e.target.files?.[0] || null)}
          />
        </div>
        {logFile && <div className="file-name">{logFile.name}</div>}
        <button 
          type="submit" 
          disabled={!logFile}
        >
          Analyze
        </button>
      </div>
    </form>
  );
};