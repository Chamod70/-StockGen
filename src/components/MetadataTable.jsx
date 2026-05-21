
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import './MetadataTable.css';

const MetadataTable = ({ items, onUpdateItem, config }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="glass-panel table-container animate-fade-in">
      <table className="metadata-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title (Max {config?.titleLength || 120})</th>
            <th>Keywords (Max {config?.keywordCount || 49})</th>
            <th>Category</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="thumbnail-cell">
                <div className="thumbnail-wrapper">
                  <img src={item.preview} alt={item.file.name} className="thumbnail" />
                  <span className="filename" title={item.file.name}>{item.file.name}</span>
                </div>
              </td>
              <td className="title-cell">
                <textarea 
                  className="input-field" 
                  value={item.metadata?.title || ''}
                  onChange={(e) => onUpdateItem(index, 'title', e.target.value)}
                  placeholder="Waiting for AI..."
                  disabled={item.status === 'processing' || item.status === 'pending'}
                  rows={3}
                />
                {item.metadata?.title && (
                  <div className={`char-count ${item.metadata.title.length > (config?.titleLength || 120) ? 'error-text' : ''}`}>
                    {item.metadata.title.length}/{config?.titleLength || 120}
                  </div>
                )}
              </td>
              <td className="keywords-cell">
                <textarea 
                  className="input-field" 
                  value={item.metadata?.keywords || ''}
                  onChange={(e) => onUpdateItem(index, 'keywords', e.target.value)}
                  placeholder="Waiting for AI..."
                  disabled={item.status === 'processing' || item.status === 'pending'}
                  rows={4}
                />
                {item.metadata?.keywords && (
                  <div className="keyword-count">
                    {item.metadata.keywords.split(',').length} keywords
                  </div>
                )}
              </td>
              <td className="category-cell">
                <input 
                  type="number"
                  min="1"
                  max="21"
                  className="input-field category-input" 
                  value={item.metadata?.category || ''}
                  onChange={(e) => onUpdateItem(index, 'category', e.target.value)}
                  placeholder="-"
                  disabled={item.status === 'processing' || item.status === 'pending'}
                />
              </td>
              <td className="status-cell">
                {item.status === 'pending' && <span className="status pending">Pending</span>}
                {item.status === 'processing' && <Loader2 className="spinner text-gradient" size={24} />}
                {item.status === 'done' && <CheckCircle2 className="text-success" size={24} />}
                {item.status === 'error' && (
                  <div className="status-error" title={item.error} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <AlertCircle className="text-error" size={24} />
                    <span style={{fontSize: '0.7rem', color: 'var(--error)', marginTop: '4px', maxWidth: '80px', wordWrap: 'break-word'}}>{item.error}</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetadataTable;
