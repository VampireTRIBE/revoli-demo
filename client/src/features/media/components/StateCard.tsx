import { AlertTriangle, DatabaseZap } from 'lucide-react';

export function ErrorState({ message = 'This section could not be loaded.' }: { message?: string }) {
  return <div className="state-card error"><AlertTriangle size={18} /><span>{message}</span></div>;
}

export function EmptyState({ message = 'No Media data is available for this period.' }: { message?: string }) {
  return <div className="state-card"><DatabaseZap size={18} /><span>{message}</span></div>;
}
