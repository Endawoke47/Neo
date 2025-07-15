'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download, Eye } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportResult {
  successful: any[];
  failed: any[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<ImportResult>;
  title: string;
  acceptedFileTypes: string[];
  sampleHeaders: string[];
  templateData: any[];
  isLoading?: boolean;
}

export default function FileImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  acceptedFileTypes,
  sampleHeaders,
  templateData,
  isLoading = false
}: FileImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setParsedData(results.data);
            setHeaders(Object.keys(results.data[0] as object));
            setStep('preview');
          }
        },
        error: (error) => {
          alert(`Error parsing CSV: ${error.message}`);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length > 0) {
            setParsedData(jsonData);
            setHeaders(Object.keys(jsonData[0] as object));
            setStep('preview');
          }
        } catch (error) {
          alert(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    try {
      const result = await onImport(parsedData);
      setImportResult(result);
      setStep('result');
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse({
      fields: sampleHeaders,
      data: templateData
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetModal = () => {
    setStep('upload');
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
    setFileName('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Download Template</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download our template to ensure your data is formatted correctly.
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-lg text-primary-600">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-lg text-gray-600 mb-2">
                      Drag & drop a file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: {acceptedFileTypes.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Expected Headers */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Expected Headers</h3>
                <div className="flex flex-wrap gap-2">
                  {sampleHeaders.map((header, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Preview Import Data</h3>
                  <p className="text-sm text-gray-500">
                    Review your data before importing. Found {parsedData.length} records.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.slice(0, 10).map((row: any, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {headers.map((header, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                              title={row[header]}
                            >
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Showing first 10 of {parsedData.length} records
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Import Complete</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your data has been processed successfully.
                </p>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.summary.total}</div>
                  <div className="text-sm text-blue-800">Total Records</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.summary.successful}</div>
                  <div className="text-sm text-green-800">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.summary.failed}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>

              {/* Failed Records */}
              {importResult.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <h4 className="text-sm font-medium text-red-800">Failed Records</h4>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {importResult.failed.map((failure: any, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {failure.row}: {failure.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <button
                  onClick={resetModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Import More
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}