import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileArchive, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import { mediaApi } from '../features/media/services/media-api';
import { ErrorState } from '../features/media/components/StateCard';

export function MediaImportPage() {
  const [file, setFile] = useState<File>();
  const [replaceExisting, setReplaceExisting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Choose a package first.');
      return mediaApi.importPackage(file, replaceExisting);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
  return <div className="page import-page">
    <header className="media-header"><div><div className="page-kicker">Controlled monthly workflow</div><h1>Media Import</h1><p>Validate, reconcile and persist a monthly workbook or ZIP package before it becomes reportable.</p></div></header>
    <div className="import-layout">
      <section className="section-card import-card"><div className="upload-icon"><UploadCloud size={28}/></div><h2>Upload monthly data package</h2><p>Accepted formats: .xlsx or .zip · maximum 50 MB. The server detects workbooks by structure, not filename alone.</p>
        <input ref={input} type="file" accept=".xlsx,.zip" hidden onChange={(event) => { setFile(event.target.files?.[0]); mutation.reset(); }} />
        <button className="primary-button" onClick={() => input.current?.click()}><FileArchive size={16}/>{file ? 'Choose another file' : 'Choose package'}</button>
        {file && <div className="selected-file"><FileArchive size={18}/><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></div></div>}
        <label className="replace-check"><input type="checkbox" checked={replaceExisting} onChange={(event) => setReplaceExisting(event.target.checked)} /><span><strong>Replace existing period</strong>Use only for a corrected, already imported month. Replacement runs in one MongoDB transaction.</span></label>
        <button className="complete-button" disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <RefreshCw className="spin-icon" size={16}/> : <ShieldCheck size={16}/>} {mutation.isPending ? 'Validating and reconciling…' : 'Complete import'}</button>
      </section>
      <section className="section-card workflow-card"><div className="section-eyebrow">What the engine checks</div><h2>Import safeguards</h2><ol>{['File and workbook detection','Required sheet and column validation','Period and partial-period detection','Numeric and label validation','Source total reconciliation','Duplicate-period protection','Atomic persistence or rollback'].map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section>
    </div>
    {mutation.isError && <ErrorState message={mutation.error instanceof Error ? mutation.error.message : 'Import failed.'} />}
    {mutation.data && <section className="section-card import-result"><header><CheckCircle2 size={22}/><div><div className="section-eyebrow">{mutation.data.status}</div><h2>Import completed</h2></div></header><div className="result-grid"><div><span>Batch</span><strong>{mutation.data.batchId}</strong></div><div><span>Periods</span><strong>{mutation.data.detectedPeriods.length}</strong></div><div><span>Files</span><strong>{mutation.data.files.length}</strong></div><div><span>Checks passed</span><strong>{mutation.data.reconciliationChecks.filter((check) => check.passed).length}</strong></div></div><div className="table-scroll"><table><thead><tr><th>File</th><th>Detected type</th><th>Status</th><th className="num">Rows</th></tr></thead><tbody>{mutation.data.files.map((item) => <tr key={item.originalName}><td>{item.originalName}</td><td>{item.detectedType}</td><td><span className="status status-verified">{item.status}</span></td><td className="num">{item.rowCount}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
