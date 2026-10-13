import React, { useState } from 'react';
import { CareTask } from '../../types';
import { Modal } from '../ui/Modal';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, FileCheck, Info } from 'lucide-react';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CareTask;
  onUploadSuccess: (taskId: string, fileName: string, fileSize: string, file?: File) => void;
}

export const ReportUploadModal: React.FC<ReportUploadModalProps> = ({
  isOpen,
  onClose,
  task,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fastingConfirmed, setFastingConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Please select a valid PDF, PNG, or JPEG file.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleSimulateDrop = () => {
    // Convenient shortcut for demo: auto-select a realistic demo PDF
    const mockFile = new File(['mock content'], `${task.title.toLowerCase().replace(/\s+/g, '_')}_result.pdf`, {
      type: 'application/pdf',
    });
    setSelectedFile(mockFile);
    setErrorMsg(null);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setErrorMsg('Please choose a report file to upload.');
      return;
    }

    if (task.fastingRequired && !fastingConfirmed) {
      setErrorMsg('Please confirm whether the required fasting protocol was observed.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    // Simulate upload and PyMuPDF OCR processing
    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          const sizeString = `${(selectedFile.size / (1024 * 1024) || 1.15).toFixed(2)} MB`;
          onUploadSuccess(task.id, selectedFile.name, sizeString, selectedFile);
          onClose();
        }, 400);
      }
    }, 150);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Diagnostic Report"
      subtitle={`Task: ${task.title} • Target: ${task.partnerFacility || 'Accredited Diagnostic Center'}`}
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>Local demo prototype upload</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors"
            >
              {isUploading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing OCR ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit for Staff Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Governance banner */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>Human-in-the-Loop Safe Ingestion Pipeline</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Uploaded files are stored as legal sources of truth. PyMuPDF and Tesseract will extract draft values, but a hospital coordinator must verify numbers before the ordering physician is dispatched.
          </p>
        </div>

        {/* Dropzone */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-400 hover:bg-teal-50/20 transition-all">
          <input
            type="file"
            id="report-file-input"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-full mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Choose a file or drag & drop'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard diagnostic PDF, PNG, or JPEG (Max 10 MB)
            </p>

            {!selectedFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulateDrop();
                }}
                className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
              >
                + Select Sample {task.title.split(' ')[0]} PDF
              </button>
            )}
          </div>
        </div>

        {/* Selected file preview pill */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-teal-700" />
              <div>
                <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for document intelligence parse
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
              Ready
            </span>
          </div>
        )}

        {/* Fasting Protocol Checkbox */}
        {task.fastingRequired && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fastingConfirmed}
                onChange={(e) => setFastingConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-amber-900">
                  Fasting Protocol Attestation
                </span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  I confirm that the required 8–12 hour overnight fasting protocol was observed prior to sample collection.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-teal-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Parsing lab headers and reference ranges...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
