import React from 'react';
import { CareTask } from '../../types';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface MockLabReportPreviewProps {
  task: CareTask;
}

export const MockLabReportPreview: React.FC<MockLabReportPreviewProps> = ({ task }) => {
  const isHbA1c = task.title.toLowerCase().includes('hba1c');
  const isRenal = task.title.toLowerCase().includes('renal') || task.title.toLowerCase().includes('creatinine');

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 text-slate-800 text-xs font-mono select-none overflow-x-auto">
      {/* Lab Header */}
      <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 text-white rounded">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950 uppercase font-sans">
                MetroPath Diagnostic Laboratories
              </h2>
              <p className="text-[10px] text-slate-500 font-sans">
                CAP Accredited • CLIA ID: 05D9823104 • 420 Lexington Health Blvd, Suite 200
              </p>
            </div>
          </div>
        </div>
        <div className="text-right font-sans">
          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            <ShieldCheck className="w-3 h-3 text-teal-600" /> SOURCE DOCUMENT #MPL-8829-X
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Final Certified Report</p>
        </div>
      </div>

      {/* Patient & Specimen Demographics Box */}
      <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[11px] font-sans">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Patient Name</p>
          <p className="font-bold text-slate-900">{task.patientName}</p>
          <p className="text-[10px] text-slate-500">DOB: 1974-05-14 (52y)</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Medical Record #</p>
          <p className="font-bold text-slate-900 font-mono">MRN-84920</p>
          <p className="text-[10px] text-slate-500">Gender: Male</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Ordering Physician</p>
          <p className="font-bold text-slate-900">{task.doctorName}</p>
          <p className="text-[10px] text-slate-500">Clinic: Endocrinology Dept</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Specimen Collection</p>
          <p className="font-bold text-slate-900 font-mono">2026-10-12 08:45 AM</p>
          <p className="text-[10px] text-slate-500">Venous Whole Blood</p>
        </div>
      </div>

      {/* Test Panel Table */}
      <div className="mt-4">
        <div className="bg-slate-100 p-2 rounded-t font-sans font-bold text-[11px] text-slate-700 flex justify-between items-center">
          <span>TEST / ASSAY</span>
          <span className="text-[10px] text-slate-500 font-normal">Method: HPLC &amp; Enzymatic Rate</span>
        </div>
        
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-sans text-[10px] uppercase">
              <th className="py-2 px-2">Diagnostic Test</th>
              <th className="py-2 px-2">Observed Result</th>
              <th className="py-2 px-2">Flag</th>
              <th className="py-2 px-2">Reference Range</th>
              <th className="py-2 px-2">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {isHbA1c ? (
              <>
                <tr className="bg-rose-50/40">
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">
                    Hemoglobin A1c (HbA1c)
                  </td>
                  <td className="py-2.5 px-2 font-bold text-rose-700">7.4</td>
                  <td className="py-2.5 px-2 font-bold text-rose-600">HIGH *</td>
                  <td className="py-2.5 px-2 text-slate-500">&lt; 5.7</td>
                  <td className="py-2.5 px-2 text-slate-600">%</td>
                </tr>
                <tr className="bg-rose-50/40">
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">
                    Estimated Average Glucose (eAG)
                  </td>
                  <td className="py-2.5 px-2 font-bold text-rose-700">166</td>
                  <td className="py-2.5 px-2 font-bold text-rose-600">HIGH *</td>
                  <td className="py-2.5 px-2 text-slate-500">&lt; 117</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">
                    Fasting Plasma Glucose (Venous)
                  </td>
                  <td className="py-2.5 px-2 font-bold text-rose-700">142</td>
                  <td className="py-2.5 px-2 font-bold text-rose-600">HIGH *</td>
                  <td className="py-2.5 px-2 text-slate-500">70 - 99</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
              </>
            ) : isRenal ? (
              <>
                <tr>
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">Serum Creatinine</td>
                  <td className="py-2.5 px-2 font-bold text-slate-800">1.14</td>
                  <td className="py-2.5 px-2 text-emerald-600">NORMAL</td>
                  <td className="py-2.5 px-2 text-slate-500">0.60 - 1.20</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">Estimated GFR (CKD-EPI)</td>
                  <td className="py-2.5 px-2 font-bold text-slate-800">64</td>
                  <td className="py-2.5 px-2 text-emerald-600">NORMAL</td>
                  <td className="py-2.5 px-2 text-slate-500">&gt; 60</td>
                  <td className="py-2.5 px-2 text-slate-600">mL/min/1.73m²</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">Blood Urea Nitrogen (BUN)</td>
                  <td className="py-2.5 px-2 font-bold text-slate-800">19</td>
                  <td className="py-2.5 px-2 text-emerald-600">NORMAL</td>
                  <td className="py-2.5 px-2 text-slate-500">7 - 20</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
              </>
            ) : (
              <>
                <tr className="bg-rose-50/40">
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">Total Cholesterol</td>
                  <td className="py-2.5 px-2 font-bold text-rose-700">224</td>
                  <td className="py-2.5 px-2 font-bold text-rose-600">HIGH *</td>
                  <td className="py-2.5 px-2 text-slate-500">&lt; 200</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
                <tr className="bg-rose-50/40">
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">LDL Cholesterol (Calc)</td>
                  <td className="py-2.5 px-2 font-bold text-rose-700">145</td>
                  <td className="py-2.5 px-2 font-bold text-rose-600">HIGH *</td>
                  <td className="py-2.5 px-2 text-slate-500">&lt; 100</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium font-sans text-slate-900">HDL Cholesterol</td>
                  <td className="py-2.5 px-2 font-bold text-slate-800">42</td>
                  <td className="py-2.5 px-2 text-emerald-600">NORMAL</td>
                  <td className="py-2.5 px-2 text-slate-500">&gt; 40</td>
                  <td className="py-2.5 px-2 text-slate-600">mg/dL</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Lab Certification Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Electronic Sign-off: Robert Vance, MD • Chief of Pathology</span>
        </div>
        <div className="font-mono">
          BARCODE: ||| | |||| || ||| |||| 88294
        </div>
      </div>
    </div>
  );
};
