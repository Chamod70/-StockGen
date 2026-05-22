import { useState, useEffect } from 'react';
import { KeyRound, Brain, Plus, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import './ApiKeyManager.css';

const ApiKeyManager = ({ onKeyChange, onModelChange }) => {
  const [keys, setKeys] = useState(() => {
    const saved = localStorage.getItem('groq_api_keys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [{ id: 1, value: '' }];
      }
    }
    return [{ id: 1, value: localStorage.getItem('grok_api_key') || '' }];
  });
  
  const [activeModel, setActiveModel] = useState(() => {
    return localStorage.getItem('groq_active_model') || '';
  });
  
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    localStorage.setItem('groq_api_keys', JSON.stringify(keys));
    if (keys.length > 0 && keys[0].value) {
      onKeyChange(keys[0].value);
    } else {
      onKeyChange('');
    }
  }, [keys, onKeyChange]);

  useEffect(() => {
    localStorage.setItem('groq_active_model', activeModel);
    if (onModelChange && activeModel) {
      onModelChange(activeModel);
    }
  }, [activeModel, onModelChange]);

  // Fetch models dynamically from Groq
  useEffect(() => {
    const fetchModels = async () => {
      const currentKey = keys.length > 0 ? keys[0].value : '';
      if (!currentKey) return;
      
      setLoadingModels(true);
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${currentKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter to try and show vision models first, or just list them all
          let models = data.data.map(m => m.id);
          // Sort so vision models appear first
          models.sort((a, b) => {
            const aVis = a.toLowerCase().includes('vision');
            const bVis = b.toLowerCase().includes('vision');
            if (aVis && !bVis) return -1;
            if (!aVis && bVis) return 1;
            return a.localeCompare(b);
          });
          
          setAvailableModels(models);
          
          if (!activeModel && models.length > 0) {
            setActiveModel(models[0]);
          } else if (models.length > 0 && !models.includes(activeModel)) {
            // If previous model is no longer available
            const visionModel = models.find(m => m.toLowerCase().includes('vision'));
            setActiveModel(visionModel || models[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setLoadingModels(false);
      }
    };
    
    // Debounce the fetch slightly so it doesn't run on every keystroke
    const timeoutId = setTimeout(fetchModels, 1000);
    return () => clearTimeout(timeoutId);
  }, [keys[0]?.value]); // re-run when the primary key changes

  const addKey = () => {
    if (keys.length < 3) {
      setKeys([...keys, { id: Date.now(), value: '' }]);
    }
  };

  const removeKey = (id) => {
    if (keys.length > 1) {
      setKeys(keys.filter(k => k.id !== id));
    } else {
      setKeys([{ id: Date.now(), value: '' }]); // keep at least one empty
    }
  };

  const updateKey = (id, value) => {
    setKeys(keys.map(k => k.id === id ? { ...k, value } : k));
  };

  return (
    <div className="groq-panel animate-fade-in">
      <div className="groq-panel-header">
        <div className="groq-title-group">
          <KeyRound className="groq-icon" size={24} />
          <h2 className="groq-title">Groq API & Models</h2>
        </div>
        <div className="groq-badge">{keys.length}/3</div>
      </div>
      
      <div className="groq-keys-container">
        {keys.map((key, index) => (
          <div key={key.id} className="groq-key-row">
            <KeyRound className="groq-key-icon" size={18} />
            <span className="groq-key-label">Key {index + 1}:</span>
            <input
              type="text"
              className="groq-key-input"
              value={key.value}
              onChange={(e) => updateKey(key.id, e.target.value)}
              placeholder="gsk_...u3DY"
            />
            <button className="groq-delete-btn" onClick={() => removeKey(key.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {keys.length < 3 && (
          <button className="groq-add-btn" onClick={addKey}>
            <Plus size={16} /> Add Another Key
          </button>
        )}
      </div>

      <div className="groq-divider"></div>

      <div className="groq-model-section">
        <div className="groq-model-header">
          <Brain className="groq-icon text-secondary" size={20} />
          <h3 className="groq-subtitle">Select Vision Model</h3>
          {loadingModels && <RefreshCw className="groq-icon text-secondary spin-icon" size={14} />}
        </div>
        
        <div className="groq-select-wrapper">
          <select 
            className="groq-select"
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            disabled={availableModels.length === 0}
          >
            {availableModels.length === 0 ? (
              <option value={activeModel || "Loading models..."}>{activeModel || "Loading models..."}</option>
            ) : (
              availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))
            )}
          </select>
          <ChevronDown className="groq-select-icon" size={20} />
        </div>
        
        <div className="groq-active-model">
          <span className="text-secondary">Active: </span>
          <span className="text-primary">{activeModel}</span>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
