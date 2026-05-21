export const exportToCSV = (data) => {
  if (!data || !data.length) return;

  const headers = ['filename', 'title', 'keywords', 'category', 'releases'];
  
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '';
    const stringified = String(str);
    // If string contains comma, quote, or newline, it must be wrapped in quotes
    // and inner quotes must be doubled
    if (/[",\n]/.test(stringified)) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const rows = data.map(row => {
    return [
      escapeCSV(row.filename),
      escapeCSV(row.title),
      escapeCSV(row.keywords),
      escapeCSV(row.category),
      escapeCSV(row.releases || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  // Create blob and download (Adding BOM for UTF-8 Excel compatibility)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `adobe_stock_metadata_${new Date().getTime()}.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};
