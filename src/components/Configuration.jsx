import React from 'react';
import { SlidersHorizontal, Settings, Type, Hash, AlignLeft, Plus } from 'lucide-react';
import './Configuration.css';

const Configuration = ({ config, setConfig }) => {
  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="groq-panel animate-fade-in config-panel">
      <div className="groq-panel-header">
        <div className="groq-title-group">
          <SlidersHorizontal className="groq-icon" size={24} />
          <h2 className="groq-title">Configuration</h2>
        </div>
        <button className="settings-btn"><Settings size={18} /></button>
      </div>

      <div className="config-grid">
        <div className="config-item">
          <div className="config-label-group">
            <Type size={16} className="text-secondary" />
            <label>Title Length ({config.titleLength} chars)</label>
          </div>
          <input 
            type="range" 
            min="50" max="200" 
            value={config.titleLength} 
            onChange={(e) => handleChange('titleLength', Number(e.target.value))}
            className="config-slider"
          />
        </div>

        <div className="config-item">
          <div className="config-label-group">
            <Hash size={16} className="text-secondary" />
            <label>Keywords Count ({config.keywordCount} words)</label>
          </div>
          <input 
            type="range" 
            min="10" max="50" 
            value={config.keywordCount} 
            onChange={(e) => handleChange('keywordCount', Number(e.target.value))}
            className="config-slider"
          />
        </div>

        <div className="config-item">
          <div className="config-label-group">
            <AlignLeft size={16} className="text-secondary" />
            <label>Desc Length ({config.descLength} chars)</label>
          </div>
          <input 
            type="range" 
            min="50" max="300" 
            value={config.descLength} 
            onChange={(e) => handleChange('descLength', Number(e.target.value))}
            className="config-slider"
          />
        </div>

        <div className="config-item">
          <div className="config-label-group">
            <Plus size={16} className="text-secondary" />
            <label>Include Keywords</label>
          </div>
          <input 
            type="text" 
            className="config-input" 
            placeholder="e.g. 3d, abstract, modern"
            value={config.includeKeywords}
            onChange={(e) => handleChange('includeKeywords', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default Configuration;
