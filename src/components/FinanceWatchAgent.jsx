import React, { useState, useEffect } from 'react';
import { Upload, TrendingUp, FileText, BarChart3, Sparkles, AlertCircle, CheckCircle, Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import jsPDF from "jspdf";

export default function FinanceWatchAgent() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [trends, setTrends] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [validationMode, setValidationMode] = useState(false);
  const [editingTrend, setEditingTrend] = useState(null);
  const [history, setHistory] = useState([]);
  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Rapport Hebdomadaire – FinanceWatch AI", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("Synthèse Executive", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(report.executive_summary, 20, y, { maxWidth: 170 });
    y += 20;

    doc.setFontSize(14);
    doc.text("Tendances Clés", 20, y);
    y += 8;

    report.key_trends.forEach((t) => {
      doc.setFontSize(11);
      doc.text(`• ${t}`, 25, y, { maxWidth: 160 });
      y += 8;
    });

    y += 5;
    doc.setFontSize(14);
    doc.text("Recommandations", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(report.recommendations, 20, y, { maxWidth: 170 });

    doc.save("rapport_financewatch.pdf");
  };

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('finance-watch-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      status: 'ready',
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const analyzeDocuments = async () => {
    setAnalyzing(true);
    setError(null);
    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' })));
    
    try {
      const formData = new FormData();
      uploadedFiles.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      const response = await fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTrends(data.trends.map((t, idx) => ({ ...t, id: idx })) || []);
        setReport(data.report || null);
        setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
        setValidationMode(true);
        setActiveTab('validation');
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Impossible de se connecter au backend. Utilisation des données de démonstration.`);
      
      setTrends([
        { id: 0, category: 'Crypto & Blockchain', sentiment: 85, mentions: 234, change: '+12%', description: 'Forte hausse du marché crypto' },
        { id: 1, category: 'Taux d\'intérêt', sentiment: 42, mentions: 189, change: '-8%', description: 'Incertitudes sur la politique monétaire' },
        { id: 2, category: 'IA & Tech', sentiment: 78, mentions: 156, change: '+24%', description: 'Croissance explosive de l\'IA' },
        { id: 3, category: 'Marchés émergents', sentiment: 61, mentions: 98, change: '+5%', description: 'Stabilisation progressive' }
      ]);
      
      setReport({
        executive_summary: 'Cette semaine, les marchés financiers ont été marqués par une forte volatilité dans le secteur technologique, avec une attention particulière portée aux développements en intelligence artificielle.',
        key_trends: [
          'Crypto & Blockchain : Hausse significative de 12% des mentions, sentiment très positif (85%)',
          'Intelligence Artificielle : Croissance explosive de 24%, avec 156 mentions dans les rapports analysés',
          'Taux d\'intérêt : Sentiment en baisse (-8%), reflétant les incertitudes des marchés'
        ],
        recommendations: 'Surveiller de près les annonces de politique monétaire et les développements réglementaires dans le secteur crypto.'
      });
      
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
      setValidationMode(true);
      setActiveTab('validation');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEditTrend = (trend) => {
    setEditingTrend({ ...trend });
  };

  const handleSaveTrend = () => {
    setTrends(prev => prev.map(t => t.id === editingTrend.id ? editingTrend : t));
    setEditingTrend(null);
  };

  const handleDeleteTrend = (id) => {
    setTrends(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTrend = () => {
    const newTrend = {
      id: Date.now(),
      category: 'Nouvelle tendance',
      sentiment: 50,
      mentions: 0,
      change: '0%',
      description: 'Description à compléter'
    };
    setTrends(prev => [...prev, newTrend]);
    setEditingTrend(newTrend);
  };

  const handleApprove = () => {
    const newReport = {
      date: new Date().toLocaleDateString('fr-FR'),
      trends: trends,
      report: report
    };
    
    const updatedHistory = [newReport, ...history].slice(0, 3);
    setHistory(updatedHistory);
    localStorage.setItem('finance-watch-history', JSON.stringify(updatedHistory));
    
    setValidationMode(false);
    setActiveTab('trends');
  };

  const getPreviousWeekComparison = (category) => {
    if (history.length === 0) return null;
    const prevTrend = history[0].trends.find(t => t.category === category);
    return prevTrend;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FinanceWatch AI</h1>
                <p className="text-xs text-slate-400">Intelligence de marché avec validation humaine</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {history.length > 0 && (
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-400">✓ {history.length} rapport(s) validé(s)</div>
                  <div className="text-xs text-slate-500">Dernier : {history[0].date}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'upload', icon: Upload, label: 'Documents' },
              { id: 'validation', icon: CheckCircle, label: 'Validation', badge: validationMode },
              { id: 'trends', icon: BarChart3, label: 'Tendances' },
              { id: 'report', icon: FileText, label: 'Rapport' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id === 'validation' && !validationMode}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-all relative ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                } ${tab.id === 'validation' && !validationMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ajouter des documents</h3>
                  <p className="text-slate-400 text-sm">PDF, TXT, articles web, rapports financiers</p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg cursor-pointer transition-all font-medium">
                    Parcourir les fichiers
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">{error}</div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Documents uploadés ({uploadedFiles.length})</h3>
                  <button
                    onClick={analyzeDocuments}
                    disabled={analyzing}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyser avec l'IA
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-sm">{file.name}</div>
                          <div className="text-xs text-slate-500">{file.size}</div>
                        </div>
                      </div>
                      <div className={`text-xs px-3 py-1 rounded-full ${
                        file.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        file.status === 'analyzing' ? 'bg-blue-500/20 text-blue-400 flex items-center gap-2' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {file.status === 'completed' ? '✓ Analysé' :
                         file.status === 'analyzing' ? (
                          <>
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            En cours...
                          </>
                         ) :
                         'Prêt'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <strong>Workflow :</strong> Uploadez → Analysez avec l'IA → Validez manuellement → Publiez le rapport final
              </div>
            </div>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && validationMode && (
          <div className="space-y-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-orange-200">
                  <strong>Mode validation :</strong> Vérifiez et ajustez les tendances détectées par l'IA avant publication.
                </div>
              </div>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver et publier
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {trends.map((trend) => (
                <div key={trend.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                  {editingTrend?.id === trend.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingTrend.category}
                        onChange={(e) => setEditingTrend({ ...editingTrend, category: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                      <textarea
                        value={editingTrend.description}
                        onChange={(e) => setEditingTrend({ ...editingTrend, description: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        rows="2"
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-400">Sentiment (%)</label>
                          <input
                            type="number"
                            value={editingTrend.sentiment}
                            onChange={(e) => setEditingTrend({ ...editingTrend, sentiment: parseInt(e.target.value) })}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Mentions</label>
                          <input
                            type="number"
                            value={editingTrend.mentions}
                            onChange={(e) => setEditingTrend({ ...editingTrend, mentions: parseInt(e.target.value) })}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Variation</label>
                          <input
                            type="text"
                            value={editingTrend.change}
                            onChange={(e) => setEditingTrend({ ...editingTrend, change: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTrend}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingTrend(null)}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{trend.category}</h3>
                          <p className="text-sm text-slate-400 mb-3">{trend.description}</p>
                          {history.length > 0 && getPreviousWeekComparison(trend.category) && (
                            <div className="text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded inline-block">
                              Semaine précédente: {getPreviousWeekComparison(trend.category).sentiment}% sentiment
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTrend(trend)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrend(trend.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400 mb-1">Sentiment</div>
                          <div className="font-medium">{trend.sentiment}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-1">Mentions</div>
                          <div className="font-medium">{trend.mentions}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-1">Variation</div>
                          <div className={`font-medium ${trend.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend.change}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              <button
                onClick={handleAddTrend}
                className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl p-8 flex items-center justify-center gap-3 text-slate-400 hover:text-slate-300 transition-all"
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Ajouter une tendance</span>
              </button>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {trends.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 backdrop-blur-sm text-center">
                <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune analyse disponible</h3>
                <p className="text-slate-400 mb-6">Uploadez et analysez des documents pour voir les tendances</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all font-medium"
                >
                  Ajouter des documents
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trends.map((trend) => (
                  <div key={trend.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">{trend.category}</h3>
                      <div className={`text-sm font-medium px-2 py-1 rounded ${
                        trend.change.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trend.change}
                      </div>
                    </div>
                    
                    {trend.description && (
                      <p className="text-sm text-slate-400 mb-4">{trend.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">Sentiment</span>
                          <span className="font-medium">{trend.sentiment}%</span>
                        </div>
                        <div className="w-full bg-slate-700/30 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${trend.sentiment}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/30">
                        <span className="text-slate-400">Mentions</span>
                        <span className="font-medium text-blue-400">{trend.mentions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {!report ? (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 backdrop-blur-sm text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun rapport disponible</h3>
                <p className="text-slate-400 mb-6">Analysez des documents pour générer un rapport</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all font-medium"
                >
                  Ajouter des documents
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Rapport Hebdomadaire</h2>
                    <p className="text-slate-400">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all font-medium"
                  >
                    Télécharger PDF
                  </button>

                </div>

                <div className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Synthèse Executive</h3>
                    <p className="leading-relaxed">{report.executive_summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Tendances Clés</h3>
                    <ul className="space-y-2">
                      {report.key_trends.map((trend, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Recommandations</h3>
                    <p className="leading-relaxed">{report.recommendations}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}