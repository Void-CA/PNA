import React, { type ChangeEvent } from 'react';
import { GraduationCap, FileUp } from 'lucide-react';

interface WelcomeScreenProps {
  ready: boolean;
  loading: boolean;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ ready, loading, onFile }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
    <div className="max-w-md space-y-6">
      <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
        <GraduationCap size={32} />
      </div>
      <div>
        <h1 className="text-3xl font-black text-slate-800">Procesador de Notas</h1>
        <p className="text-slate-500 mt-2 text-lg">Análisis estadístico académico procesado localmente.</p>
      </div>

      {!ready ? (
        <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
          Inicializando motor WASM...
        </div>
      ) : (
        <label className="block group">
          <div className={`
            flex flex-col items-center p-10 border-2 border-dashed rounded-3xl transition-all cursor-pointer
            ${loading ? 'bg-slate-100 border-slate-300' : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xl'}
          `}>
            {loading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            ) : (
              <>
                <FileUp size={40} className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-slate-700 font-bold text-lg">Sube tu archivo</span>
                <span className="text-slate-400 text-sm mt-1">Nombre, Exam1, Exam2...</span>
              </>
            )}
          </div>
          <input type="file" className="hidden" onChange={onFile} accept=".xls" disabled={loading} />
        </label>
      )}
    </div>
  </div>
);

export default WelcomeScreen;
