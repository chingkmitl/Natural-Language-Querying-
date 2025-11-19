import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  BarChart3, 
  RefreshCcw, 
  Send,
  Database,
  CloudUpload,
  CloudDownload
} from 'lucide-react';
import { FinancialRecord, RawCsvRow, AppStatus, AnalysisResult } from './types';
import { analyzeData } from './services/geminiService';
import { saveRecordsToDb, getRecordsFromDb } from './services/supabaseClient';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [data, setData] = useState<FinancialRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Handlers --

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.PARSING);
    setFileName(file.name);
    setError(null);
    setResult(null);

    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(), // Normalize headers
      complete: (results) => {
        try {
          // Validate basic structure
          const fields = results.meta.fields || [];
          const hasAmount = fields.some(f => f.toLowerCase().includes('amount'));

          if (!hasAmount) {
            throw new Error("ไม่พบคอลัมน์ 'amount' ในไฟล์ CSV (ตรวจสอบ Header)");
          }

          const cleanedData: FinancialRecord[] = results.data
            .filter(row => row.amount) // Filter empty rows properly
            .map((row) => {
              // Remove commas and convert to number
              const amountStr = String(row.amount).replace(/,/g, '');
              const amount = parseFloat(amountStr);

              return {
                BA: row.BA || 'N/A',
                monthly: row.monthly || 'N/A',
                actCode: row.actCode || 'N/A',
                amount: isNaN(amount) ? 0 : amount
              };
            });

          if (cleanedData.length === 0) {
            throw new Error("ไม่พบข้อมูลที่สามารถใช้งานได้ในไฟล์");
          }

          setData(cleanedData);
          setStatus(AppStatus.READY);
        } catch (err) {
          setError(err instanceof Error ? err.message : "CSV Parse Error");
          setStatus(AppStatus.ERROR);
        }
      },
      error: (err) => {
        setError(`Error reading file: ${err.message}`);
        setStatus(AppStatus.ERROR);
      }
    });
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setStatus(AppStatus.ANALYZING);
    setError(null);

    try {
      const markdownReport = await analyzeData(data, query);
      setResult({
        markdown: markdownReport,
        rawResponse: markdownReport
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Processing Error");
      setStatus(AppStatus.READY); // Go back to ready to allow retry
    }
  };

  const handleReset = () => {
    setData([]);
    setFileName('');
    setQuery('');
    setResult(null);
    setStatus(AppStatus.IDLE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveToDb = async () => {
    if (data.length === 0) return;
    setIsSyncing(true);
    try {
      await saveRecordsToDb(data);
      alert(`บันทึกข้อมูล ${data.length} รายการลงฐานข้อมูลเรียบร้อยแล้ว`);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadFromDb = async () => {
    setIsSyncing(true);
    setStatus(AppStatus.PARSING);
    setError(null);
    try {
      const dbData = await getRecordsFromDb();
      if (dbData.length === 0) {
        throw new Error("ไม่พบข้อมูลในฐานข้อมูล");
      }
      setData(dbData);
      setFileName('Supabase Database');
      setStatus(AppStatus.READY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Database Load Error");
      setStatus(AppStatus.IDLE);
    } finally {
      setIsSyncing(false);
    }
  };

  // -- Render Helpers --

  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center max-w-xl w-full hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-blue-50/50">
          <Upload className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">อัปโหลดข้อมูลการเงิน</h2>
        <p className="text-slate-500 mb-10 leading-relaxed">
          รองรับไฟล์ CSV หรือโหลดข้อมูลเดิมจาก Database
          <br/>คอลัมน์ที่รองรับ: <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">BA, monthly, actCode, amount</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <label className="relative group cursor-pointer w-full sm:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
            <div className="relative flex items-center justify-center gap-3 bg-white border border-slate-200 text-blue-700 font-bold py-4 px-8 rounded-xl group-hover:bg-slate-50 transition-all">
              {status === AppStatus.PARSING ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังอ่านไฟล์...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>เลือก CSV</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={status === AppStatus.PARSING || isSyncing}
            />
          </label>

          <button 
            onClick={handleLoadFromDb}
            disabled={isSyncing || status === AppStatus.PARSING}
            className="flex items-center justify-center gap-3 bg-slate-100 border border-slate-200 text-slate-700 font-bold py-4 px-8 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {isSyncing ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
               <Database className="w-5 h-5" />
            )}
            <span>โหลดจาก DB</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / File Info */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate text-lg">{fileName}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              พร้อมใช้งาน {data.length.toLocaleString()} รายการ
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Save to DB Button */}
          <button
            onClick={handleSaveToDb}
            disabled={isSyncing}
            className="text-emerald-600 hover:bg-emerald-50 bg-white border border-slate-200 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="บันทึกข้อมูลชุดนี้ลง Supabase"
          >
             {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
             บันทึกลง DB
          </button>

          <button 
            onClick={handleReset}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            เปลี่ยนไฟล์
          </button>
        </div>
      </div>

      {/* Query Input */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
        <div className="relative flex items-center">
          <div className="absolute left-5 text-blue-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !status.includes('ANALYZING') && handleAnalyze()}
            placeholder='ถามข้อมูล เช่น "สรุปยอด amount รวมต่อ BA" หรือ "ActCode ไหนมียอดสูงสุด"'
            className="w-full pl-14 pr-36 py-4 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
            disabled={status === AppStatus.ANALYZING}
          />
          <div className="absolute right-2">
            <button
              onClick={handleAnalyze}
              disabled={status === AppStatus.ANALYZING || !query.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {status === AppStatus.ANALYZING ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>วิเคราะห์</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-50/80 backdrop-blur px-8 py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              ผลการวิเคราะห์
            </h2>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              AI Generated
            </span>
          </div>
          <div className="p-8 md:p-10 bg-white">
            <article className="prose prose-slate max-w-none prose-lg prose-headings:font-bold prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-indigo-700 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-4 prose-td:p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.markdown}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2 rounded-lg shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Gemini Financial Analyst
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
             Model: Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-red-700">เกิดข้อผิดพลาด</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {status === AppStatus.IDLE || status === AppStatus.PARSING || status === AppStatus.ERROR 
          ? renderIdle() 
          : renderAnalysis()
        }
      </main>
    </div>
  );
}

export default App;