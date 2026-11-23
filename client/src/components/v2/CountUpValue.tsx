import { useEffect, useRef, useState } from 'react';

/** One-shot, 300ms animation for source-backed numeric labels only. */
export function CountUpValue({ value }: { value: string }) {
  const [shown, setShown] = useState(value);
  const prior = useRef<string | null>(null);
  useEffect(() => {
    const parsed = /^(\s*(?:AED\s*)?)(-?[\d,]+(?:\.\d+)?)(\s*(?:%|x)?)$/.exec(value);
    if (!parsed || prior.current === value) { setShown(value); return; }
    prior.current = value;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    const prefix = parsed[1] ?? '';
    const original = parsed[2] ?? '0';
    const suffix = parsed[3] ?? '';
    const target = Number(original.replace(/,/g, ''));
    if (!Number.isFinite(target)) { setShown(value); return; }
    const decimals = original.includes('.') ? original.split('.')[1]?.length ?? 0 : 0;
    let start: number | undefined;
    let frame: number;
    const draw = (timestamp: number) => {
      start ??= timestamp;
      const fraction = Math.min(1, (timestamp - start) / 300);
      // Non-looping ease-out, with exact final text to preserve source rounding.
      if (fraction >= 1) { setShown(value); return; }
      const number = target * (1 - Math.pow(1 - fraction, 3));
      setShown(prefix + number.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix);
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return <>{shown}</>;
}
