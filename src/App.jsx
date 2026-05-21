import { useState } from 'react';
import './App.css';
import ApiKeyManager from './components/ApiKeyManager';
import Dropzone from './components/Dropzone';
import MetadataTable from './components/MetadataTable';
import Configuration from './components/Configuration';
import { generateMetadataWithGrok, fileToBase64 } from './utils/grokApi';
import { exportToCSV } from './utils/csvExport';
import { Download, Sparkles, Trash2 } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('llama-4-scout-17b-16e-instruct');
  const [config, setConfig] = useState({
    titleLength: 120,
    keywordCount: 49,
    descLength: 150,
    includeKeywords: ''
  });
  const [items, setItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appendEps, setAppendEps] = useState(false);

  const handleFilesAdded = (files) => {
    const newItems = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      metadata: null,
      error: null
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index].metadata = {
      ...updated[index].metadata,
      [field]: value
    };
    setItems(updated);
  };

  const generateAllMetadata = async () => {
    if (!apiKey) {
      alert("Please enter your Groq API key first.");
      return;
    }

    setIsGenerating(true);
    
    // Process sequentially to avoid rate limits (or use Promise.all for batches)
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;

      setItems(prev => {
        const next = [...prev];
        next[i].status = 'processing';
        return next;
      });

      try {
        const base64 = await fileToBase64(items[i].file);
        const metadata = await generateMetadataWithGrok(apiKey, base64, items[i].file.name, model, config);
        
        setItems(prev => {
          const next = [...prev];
          next[i].status = 'done';
          next[i].metadata = metadata;
          return next;
        });
      } catch (error) {
        console.error(error);
        setItems(prev => {
          const next = [...prev];
          next[i].status = 'error';
          next[i].error = error.message;
          return next;
        });
      }
    }
    
    setIsGenerating(false);
  };

  const handleExportCSV = () => {
    const dataForCSV = items
      .filter(item => item.metadata)
      .map(item => {
        let exportName = item.file.name;
        if (appendEps) {
          // Replace extension with .eps, or append .eps if no extension
          exportName = exportName.includes('.') 
            ? exportName.replace(/\.[^/.]+$/, ".eps") 
            : exportName + ".eps";
        }
        
        return {
          filename: exportName,
          title: item.metadata.title || '',
          keywords: item.metadata.keywords || '',
          category: item.metadata.category || '',
          releases: ''
        };
      });
    
    exportToCSV(dataForCSV);
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const doneCount = items.filter(i => i.status === 'done').length;

  return (
    <div className="app-container animate-fade-in">
      <header className="app-header">
        <h1 className="app-title text-gradient">
          <Sparkles className="text-gradient" size={32} />
          Antigravity StockGen
        </h1>
        {items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={appendEps} 
                onChange={(e) => setAppendEps(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              Change to .eps
            </label>
            <button 
              className="btn-primary" 
              onClick={handleExportCSV}
              disabled={doneCount === 0 || isGenerating}
            >
              <Download size={18} />
              Export CSV ({doneCount})
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        <ApiKeyManager onKeyChange={setApiKey} onModelChange={setModel} />
        <Configuration config={config} setConfig={setConfig} />
        
        <Dropzone onFilesAdded={handleFilesAdded} />

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="action-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all items?")) {
                    setItems([]);
                  }
                }}
                disabled={isGenerating}
              >
                <Trash2 size={18} />
                Clear All
              </button>
              <button 
                className="btn-primary" 
                onClick={generateAllMetadata}
                disabled={isGenerating || pendingCount === 0 || !apiKey}
              >
                <Sparkles size={18} />
                {isGenerating ? 'Generating...' : `Generate Metadata (${pendingCount} pending)`}
              </button>
            </div>
            
            {isGenerating && (
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Generation Progress</span>
                  <span>{items.filter(i => i.status === 'done' || i.status === 'error').length} / {items.length}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(items.filter(i => i.status === 'done' || i.status === 'error').length / items.length) * 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(to right, #00e5ff, #b500ff)', 
                    transition: 'width 0.3s ease-out' 
                  }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <MetadataTable items={items} onUpdateItem={handleUpdateItem} config={config} />
      </main>
    </div>
  );
}

export default App;
