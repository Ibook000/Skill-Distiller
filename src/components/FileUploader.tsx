import React, { useCallback } from 'react';
import { useDropzone, type Accept, type DropzoneOptions } from 'react-dropzone';
import { Upload, File, X, FileText, FileImage, FileCode, FileJson } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface UploadedFile {
  name: string;
  mimeType: string;
  base64: string;
  text?: string;
  size: number;
  isProcessing?: boolean;
}

interface FileUploaderProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  language: 'zh' | 'en';
}

const getFileIcon = (file: UploadedFile) => {
  const name = file.name.toLowerCase();
  const type = file.mimeType.toLowerCase();
  
  if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return <FileImage className="h-5 w-5 flex-shrink-0 text-blue-500" />;
  if (name.endsWith('.json')) return <FileJson className="h-5 w-5 flex-shrink-0 text-yellow-600" />;
  if (name.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|php|rb|swift|kt|html|css)$/)) return <FileCode className="h-5 w-5 flex-shrink-0 text-green-600" />;
  if (type.startsWith('text/') || name.match(/\.(txt|md|csv|log|rtf)$/)) return <FileText className="h-5 w-5 flex-shrink-0 text-gray-700" />;
  if (type === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="h-5 w-5 flex-shrink-0 text-red-500" />;
  
  return <File className="h-5 w-5 flex-shrink-0 text-gray-500" />;
};

export const FileUploader: React.FC<FileUploaderProps> = ({ files, setFiles, language }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      
      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = async () => {
        const result = reader.result as string;
        // result is a data URL: data:mime/type;base64,....
        const base64 = result.split(',')[1];
        
        const newFile: UploadedFile = {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64,
          size: file.size,
          isProcessing: file.type.startsWith('image/')
        };

        // Ensure PDF mime type is correct (some browsers/OS might not set it properly)
        if (file.name.toLowerCase().endsWith('.pdf')) {
          newFile.mimeType = 'application/pdf';
        }

        // Add file immediately so user sees it (possibly in processing state)
        setFiles((prev) => [...prev, newFile]);

        const updateFileText = (text: string) => {
          setFiles((prev) => prev.map(f => f.name === newFile.name ? { ...f, text, isProcessing: false } : f));
        };

        const updateFileProcessing = (isProcessing: boolean) => {
          setFiles((prev) => prev.map(f => f.name === newFile.name ? { ...f, isProcessing } : f));
        };

        const isTextFile = file.type.startsWith('text/') || 
                           file.name.match(/\.(md|json|csv|txt|rtf|log|html|xml|js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|php|rb|swift|kt)$/i);

        // If it's a text file, also read it as text for better LLM processing
        if (isTextFile) {
          const textReader = new FileReader();
          textReader.onload = () => {
            updateFileText(textReader.result as string);
          };
          textReader.readAsText(file);
        } else if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          updateFileProcessing(true);
          const arrayBufferReader = new FileReader();
          arrayBufferReader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              updateFileText(result.value);
            } catch (err) {
              console.error('Error parsing docx', err);
              updateFileProcessing(false);
            }
          };
          arrayBufferReader.readAsArrayBuffer(file);
        } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          updateFileProcessing(true);
          const arrayBufferReader = new FileReader();
          arrayBufferReader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const typedArray = new Uint8Array(arrayBuffer);
              const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
              }
              updateFileText(fullText);
            } catch (err: any) {
              console.error('Error parsing pdf', err);
              alert(`PDF 解析失败: ${err.message || '未知错误'}。请尝试将其转换为 TXT 或 Word 格式后重试。`);
              updateFileProcessing(false);
            }
          };
          arrayBufferReader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('image/')) {
          // Perform OCR on images
          try {
            const worker = await createWorker('chi_sim+eng');
            const ret = await worker.recognize(file);
            await worker.terminate();
            updateFileText(ret.data.text);
          } catch (err) {
            console.error('OCR failed', err);
            updateFileProcessing(false);
          }
        } else {
          updateFileProcessing(false);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }, [setFiles]);

  const accept: Accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt', '.md', '.csv', '.log'],
    'application/json': ['.json'],
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'text/html': ['.html', '.htm'],
    'text/javascript': ['.js', '.jsx'],
    'text/typescript': ['.ts', '.tsx'],
    'text/x-python': ['.py']
  };

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept,
    multiple: true,
    onDragEnter: undefined,
    onDragOver: undefined,
    onDragLeave: undefined
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`brutal-border p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'bg-neon-green/20' : 'bg-white hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 mb-4" />
        <h3 className="font-display text-2xl uppercase mb-2">{language === 'zh' ? '将文件拖拽至此' : 'Drop files here'}</h3>
        <p className="font-mono text-sm text-gray-600">{language === 'zh' ? '上传聊天记录、代码、简历或文章进行蒸馏。' : 'Upload chat logs, code, resumes, or writings to distill.'}</p>
        <p className="font-mono text-xs text-gray-400 mt-2">{language === 'zh' ? '支持 PDF, DOCX, TXT, MD, CSV, JSON, 代码, 图片' : 'Supports PDF, DOCX, TXT, MD, CSV, JSON, Code, Images'}</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h4 className="font-mono text-sm uppercase font-bold mb-4">{language === 'zh' ? '等待蒸馏' : 'Queued for Distillation'} ({files.length})</h4>
          <ul className="space-y-2">
            {files.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 brutal-border bg-white">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {getFileIcon(file)}
                  <span className="font-mono text-sm truncate">{file.name}</span>
                  <span className="font-mono text-xs text-gray-500 flex-shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
