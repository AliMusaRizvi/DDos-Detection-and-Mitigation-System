import React, { useEffect, useState } from 'react';
import { dbApi } from '../../lib/api';
import { FileText, Download, Calendar, Loader } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await dbApi.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-green-500/20 text-green-500 border-green-500/30">Ready</span>;
      case 'generating': return <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-blue-500/20 text-blue-500 border-blue-500/30 flex items-center"><Loader className="w-3 h-3 mr-1 animate-spin"/> Generating</span>;
      case 'pending': return <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</span>;
      default: return <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-red-500/20 text-red-500 border-red-500/30">Failed</span>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Security Reports</h1>
          <p className="text-text-secondary mt-1">Generate and view automated threat assessments</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all font-medium text-sm">
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary glass-panel rounded-2xl">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No reports generated yet.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-background-light rounded-xl border border-white/5">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-text-primary text-lg">{r.title}</h3>
                      {getStatusBadge(r.status)}
                    </div>
                    <p className="text-sm text-text-secondary mb-3">{r.summary}</p>
                    <div className="flex items-center space-x-4 text-xs text-text-muted">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(r.date_from).toLocaleDateString()} - {new Date(r.date_to).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 uppercase tracking-wider">{r.report_type}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex md:flex-col items-center gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <button 
                  disabled={r.status !== 'ready'} 
                  className="w-full flex items-center justify-center px-4 py-2 bg-background-light hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary rounded-xl transition-all border border-white/5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
