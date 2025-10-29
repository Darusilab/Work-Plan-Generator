
import React, { useState, useCallback } from 'react';
import { FileUploadIcon, LoaderIcon, ResetIcon, ErrorIcon } from './components/Icons';
import { extractTextFromPdf } from './services/pdfParser';
import { generateWorkPlan } from './services/geminiService';
import { type WorkPlan } from './types';
import { WorkPlanDisplay } from './components/WorkPlanDisplay';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [workPlan, setWorkPlan] = useState<WorkPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    } else {
      setFile(null);
      setFileName('');
      setError('Please select a valid PDF file.');
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWorkPlan(null);

    try {
      setLoadingMessage('Parsing PDF document...');
      const text = await extractTextFromPdf(file);
      
      setLoadingMessage('Analyzing content and generating work plan...');
      const plan = await generateWorkPlan(text);
      setWorkPlan(plan);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [file]);

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setWorkPlan(null);
    setError(null);
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
          <LoaderIcon className="w-16 h-16 text-indigo-500 mx-auto" />
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 animate-pulse">{loadingMessage}</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <ErrorIcon className="w-12 h-12 text-red-500 mx-auto" />
                <p className="mt-4 font-semibold text-red-700 dark:text-red-300">An Error Occurred</p>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={handleReset}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <ResetIcon className="w-5 h-5 mr-2" />
                    Try Again
                </button>
            </div>
        );
    }


    if (workPlan) {
      return <WorkPlanDisplay workPlan={workPlan} onReset={handleReset} />;
    }

    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">Upload Your Document</h2>
        <p className="mt-2 text-center text-slate-600 dark:text-slate-400">Select a PDF file to analyze and generate a work plan.</p>
        <div className="mt-8 mx-auto max-w-lg">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <div className="w-full flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <FileUploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600 dark:text-slate-300">
                            <span className="text-indigo-600 dark:text-indigo-400">Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PDF up to 10MB</p>
                    </div>
                </div>
            </label>
            {fileName && (
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Selected: <span className="font-medium text-slate-700 dark:text-slate-200">{fileName}</span>
              </p>
            )}
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={handleAnalyze}
            disabled={!file}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Analyze & Create Plan
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            PDF Work Plan Generator
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
            Instantly transform your documents into actionable project timelines.
          </p>
        </header>

        <main className="bg-white dark:bg-slate-800/50 shadow-2xl rounded-2xl p-6 sm:p-10 transition-all duration-300">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
