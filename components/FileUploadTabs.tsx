"use client";
import React, { useState, useRef } from "react";

const TABS = [
  {
    label: "Image",
    accept: "image/*",
    endpoint: "/api/upload/image",
    help: "JPG, PNG, GIF up to 10MB",
  },
  {
    label: "Video",
    accept: "video/*",
    endpoint: "/api/upload/video",
    help: "MP4, AVI, MOV up to 100MB",
  },
  {
    label: "Audio",
    accept: "audio/*",
    endpoint: "/api/upload/audio",
    help: "MP3, WAV up to 50MB",
  },
  {
    label: "Document",
    accept: ".pdf,.doc,.docx,.txt",
    endpoint: "/api/upload/document",
    help: "PDF, DOC, DOCX, TXT up to 20MB",
  },
  {
    label: "Excel",
    accept: ".xls,.xlsx",
    endpoint: "/api/upload/excel",
    help: "XLS, XLSX up to 20MB",
  },
];

export default function FileUploadTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(TABS[activeTab].endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage("Upload successful!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFileDialog = () => fileInputRef.current?.click();

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="flex border-b mb-4">
        {TABS.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === idx
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveTab(idx);
              setMessage("");
              setError("");
            }}
            disabled={isUploading}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="border rounded-lg p-8 text-center relative bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept={TABS[activeTab].accept}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? `Uploading ${TABS[activeTab].label}...` : `Upload a ${TABS[activeTab].label.toLowerCase()}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-500 font-medium"
                disabled={isUploading}
              >
                Browse files
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-2">{TABS[activeTab].help}</p>
          </div>
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          </div>
        )}
        {message && <div className="text-green-600 mt-4">{message}</div>}
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
} 