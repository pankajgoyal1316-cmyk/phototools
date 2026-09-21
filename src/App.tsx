import { useRef, useState, useEffect, useMemo, Component, type ChangeEvent, type ReactNode } from 'react';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, FileText, Maximize2, MousePointer2, Plus, RefreshCw, Scissors, Send,
  Shield, Sparkles, Upload, Wand2, X, Zap, Download, SlidersHorizontal, Lock, Mail, MessageCircle,
  Info, AlertCircle, Image as ImageIcon, FileDown, Layers, Eraser
} from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useSeo, buildJsonLd, SITE_URL } from '@/lib/seo';
import {
  loadImage, getImageDimensions, downloadBlob, formatBytes,
  pxToUnit, unitToPx,
} from '@/lib/imageUtils';
import {
  type PdfPageItem, type ImageFilter,
} from '@/lib/pdfUtils';

interface ToolCardProps { icon: ReactNode; title: string; description: string; to: string; color: string; badge?: string; }

const tools: ToolCardProps[] = [
  { icon: <Maximize2 />, title: 'Resize & Compress', description: 'Resize by pixels, cm, inches or target file size.', to: '/resize', color: 'sky', badge: 'Most popular' },
  { icon: <PenIcon />, title: 'Signature Resizer', description: 'Precise signature sizing with size limits for forms.', to: '/signature', color: 'emerald' },
  { icon: <FileText />, title: 'PDF Tools', description: 'Images to PDF with filters, plus PDF compress.', to: '/pdf', color: 'orange' },
  { icon: <Scissors />, title: 'Remove Background', description: 'Remove backgrounds and apply custom backdrops.', to: '/background', color: 'rose', badge: 'New' },
];

function PenIcon() { return <span className="text-current font-bold text-lg">✎</span>; }

function ToolCard({ icon, title, description, to, color, badge }: ToolCardProps) {
  const colors: Record<string, string> = { sky: 'bg-sky-500/10 text-sky-500', emerald: 'bg-emerald-500/10 text-emerald-500', orange: 'bg-orange-500/10 text-orange-500', rose: 'bg-rose-500/10 text-rose-500' };
  return <Link to={to} className="group card-surface p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 relative overflow-hidden">
    {badge && <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary">{badge}</span>}
    <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3`}>{icon}</div>
    <h3 className="text-lg font-bold text-app mb-2 flex items-center gap-2">{title}<ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" /></h3>
    <p className="text-sm text-muted leading-relaxed">{description}</p>
  </Link>;
}

function Home() {
  useSeo({
    title: 'Free Online Photo Tools — Resize, Compress, PDF & Background Removal',
    description: 'Free online photo tools that work entirely in your browser. Resize images, compress to exact file sizes, convert images to PDF, and remove backgrounds — no uploads, no sign-up.',
    path: '/',
    jsonLd: [
      buildJsonLd('WebApplication', {
        name: 'PhotoTools',
        url: SITE_URL,
        description: 'Privacy-first online photo tools — resize, compress, remove backgrounds, convert images to PDF. 100% browser-based.',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@type': 'Organization', name: 'PhotoTools' },
      }),
      buildJsonLd('FAQPage', {
        mainEntity: [
          { '@type': 'Question', name: 'Are my photos uploaded to a server?', acceptedAnswer: { '@type': 'Answer', text: 'Never. PhotoTools processes every image directly in your browser using HTML5 Canvas and WebAssembly. Your files stay on your device from start to finish.' } },
          { '@type': 'Question', name: 'Is PhotoTools really free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. All our core tools are free to use with no account, subscriptions, or watermarks.' } },
          { '@type': 'Question', name: 'What image formats are supported?', acceptedAnswer: { '@type': 'Answer', text: 'We support JPG, JPEG, PNG, WebP, GIF, and BMP files. Our PDF tool accepts all common image formats.' } },
          { '@type': 'Question', name: 'Will compressing reduce my image quality?', acceptedAnswer: { '@type': 'Answer', text: 'Our smart compression finds the best balance between size and quality using an optimized quality search algorithm.' } },
          { '@type': 'Question', name: 'Can I use PhotoTools on my phone?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. PhotoTools is designed to work beautifully on phones, tablets, and desktops.' } },
        ],
      }),
    ],
  });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    ['Are my photos uploaded to a server?', 'Never. PhotoTools processes every image directly in your browser using HTML5 Canvas and WebAssembly. Your files stay on your device from start to finish.'],
    ['Is PhotoTools really free?', 'Yes. All our core tools are free to use with no account, subscriptions, or watermarks.'],
    ['What image formats are supported?', 'We support JPG, JPEG, PNG, WebP, GIF, and BMP files. Our PDF tool accepts all common image formats.'],
    ['Will compressing reduce my image quality?', 'Our smart compression finds the best balance between size and quality using an optimized quality search algorithm.'],
    ['Can I use PhotoTools on my phone?', 'Absolutely. PhotoTools is designed to work beautifully on phones, tablets, and desktops.'],
  ];
  return <>
    <section className="hero-gradient relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-16 lg:pb-12 relative">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-surface/50 text-primary text-xs font-semibold uppercase tracking-wider mb-5 animate-fade-in-up"><Sparkles className="w-3.5 h-3.5" /> Simple tools. Beautiful results.</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-app animate-fade-in-up stagger-1">Your photos, <span className="text-gradient">perfected.</span></h1>
          <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto animate-fade-in-up stagger-2">A premium toolkit for everyday image tasks. Fast, private, and remarkably easy to use.</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 animate-fade-in-up stagger-3"><Link to="/resize" className="btn-primary justify-center px-6 py-3">Start editing <ArrowRight className="w-4 h-4" /></Link><button onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost border border-app/50 px-6 py-3">Explore all tools</button></div>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-muted animate-fade-in-up stagger-4"><span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-accent" /> Private by default</span><span className="w-1 h-1 rounded-full bg-muted/40" /><span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Works in your browser</span><span className="w-1 h-1 rounded-full bg-muted/40" /><span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Always free</span></div>
        </div>
      </div>
    </section>
    <section id="tools" className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      <div className="flex items-end justify-between mb-6"><div><p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">The toolkit</p><h2 className="text-2xl sm:text-3xl font-bold text-app">Everything you need</h2></div><span className="hidden sm:block text-sm text-muted">No sign-up. No watermarks.</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{tools.map((tool) => <ToolCard key={tool.to} {...tool} />)}</div>
    </section>
    <section className="bg-surface/60 border-y border-app/40 mt-16"><div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="text-center mb-12"><p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">How it works</p><h2 className="text-3xl sm:text-4xl font-bold text-app">From image to done</h2><p className="text-muted mt-3">The quickest path to better photos.</p></div><div className="grid md:grid-cols-3 gap-10 relative">{[['01', Upload, 'Choose your file', 'Drag and drop or browse your device. Your photo never leaves your browser.'], ['02', SlidersHorizontal, 'Make it yours', 'Use simple, precise controls to get the exact result you need.'], ['03', Download, 'Download instantly', 'Save your finished file in the format and quality you choose.']].map(([num, Icon, title, desc], i) => <div key={num as string} className="text-center relative animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}><div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5"><Icon className="w-7 h-7" /></div><span className="text-xs font-bold text-primary tracking-widest">{num as string}</span><h3 className="text-lg font-bold text-app mt-2 mb-2">{title as string}</h3><p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">{desc as string}</p>{i < 2 && <div className="hidden md:block absolute top-8 left-[calc(100%_-_20px)] w-[calc(100%_-_40px)] border-t border-dashed border-primary/30" />}</div>)}</div></div></section>
    <section className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Good to know</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-app">Frequently asked questions</h2>
      </div>
      <div className="space-y-3">
        {faqs.map(([q, a], i) => (
          <div key={q} className="card-surface overflow-hidden">
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between text-left p-5 font-semibold text-app">
              <span>{q}</span>
              <ChevronDown className={`w-5 h-5 text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && <div className="px-5 pb-5 text-sm text-muted leading-relaxed animate-fade-in">{a}</div>}
          </div>
        ))}
      </div>
    </section>
    <section className="bg-surface/60 border-y border-app/40"><div className="max-w-3xl mx-auto px-4 sm:px-6 py-16"><h2 className="text-2xl sm:text-3xl font-bold text-app mb-6 text-center">What is PhotoTools?</h2><div className="space-y-4 text-sm text-muted leading-relaxed"><p>PhotoTools is a collection of free, browser-based image utilities that help you handle everyday photo tasks without installing software or creating an account. Every tool runs entirely on your device — your images are never uploaded to a server.</p><p>Whether you need to resize a photo for an online form, compress an image to meet a file-size limit, convert multiple images into a single PDF, or remove the background from a product photo, PhotoTools has a focused tool for the job. There are no watermarks, no sign-ups, and no hidden costs.</p></div></div></section>
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16"><h2 className="text-2xl sm:text-3xl font-bold text-app mb-8 text-center">Our tools</h2><div className="space-y-6">{[[Maximize2, 'Resize & Compress', 'Resize images by pixels, centimeters, or inches and compress them to an exact target file size in KB or MB. Perfect for online forms, email attachments, and web uploads.', '/resize'], [PenIcon, 'Signature Resizer', 'Resize signature images to precise pixel dimensions and file-size limits for government forms, job applications, and passport documents.', '/signature'], [FileText, 'PDF Tools', 'Convert JPG, PNG, and WebP images into a single PDF document with optional filters, or compress an existing PDF to a smaller file size.', '/pdf'], [Scissors, 'Remove Background', 'Remove the background from any photo using on-device AI. Replace it with a solid color, custom image, or keep it transparent.', '/background']].map(([Icon, name, desc, to], i) => <div key={i as number} className="card-surface p-5 flex gap-4 items-start"><div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon /></div><div><h3 className="font-bold text-app text-sm mb-1">{name as string}</h3><p className="text-sm text-muted leading-relaxed mb-2">{desc as string}</p><Link to={to as string} aria-label={`Learn more about ${name as string}`} className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">Learn more <ArrowRight className="w-3.5 h-3.5" /></Link></div></div>)}</div></section>
    <section className="bg-surface/60 border-y border-app/40"><div className="max-w-3xl mx-auto px-4 sm:px-6 py-16"><h2 className="text-2xl sm:text-3xl font-bold text-app mb-6 text-center">Privacy by design</h2><div className="space-y-4 text-sm text-muted leading-relaxed"><p>PhotoTools is built around a simple privacy principle: your images should never leave your device. All processing — resizing, compressing, PDF conversion, and even AI background removal — happens locally in your browser using HTML5 Canvas, the File API, and WebAssembly.</p><p>There are no accounts, no server-side storage of your files, and no tracking of your image content. The only network requests the website makes are for loading the page itself, serving advertisements (if enabled), and downloading the AI model for background removal on first use.</p><Link to="/privacy" className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">Read our full privacy policy <ArrowRight className="w-3.5 h-3.5" /></Link></div></div></section>
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16"><h2 className="text-2xl sm:text-3xl font-bold text-app mb-6 text-center">Who uses PhotoTools?</h2><div className="grid sm:grid-cols-2 gap-4">{[['Students & applicants', 'Resize photos and signatures to exact specifications for college applications, government forms, and job portals.'], ['Online sellers', 'Compress product photos for faster page loads and remove backgrounds for clean marketplace listings.'], ['Office workers', 'Convert multiple scanned documents into a single PDF and compress large PDFs for email attachments.'], ['Casual users', 'Quickly resize a photo for a social media profile or compress an image to send via messaging apps.']].map(([title, desc], i) => <div key={i} className="card-surface p-5"><h3 className="font-bold text-app text-sm mb-2">{title}</h3><p className="text-sm text-muted leading-relaxed">{desc}</p></div>)}</div></section>
  </>;
}

function UploadZone({ onFiles, multiple = false, label = 'Drop your image here', acceptType = 'image' }: { onFiles: (files: File[]) => void; multiple?: boolean; label?: string; acceptType?: 'image' | 'pdf' }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const accept = acceptType === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp,image/gif,image/bmp';
  const handle = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const filtered = acceptType === 'pdf' ? arr.filter(f => f.type === 'application/pdf') : arr.filter(f => f.type.startsWith('image/'));
    if (filtered.length) onFiles(filtered);
  };
  return <div role="button" tabIndex={0} aria-label={label} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }} className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-app/70 hover:border-primary/60 hover:bg-primary/5'}`}><input ref={inputRef} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => { handle(e.target.files); e.target.value = ''; }} /><div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${dragging ? 'bg-primary text-white' : 'bg-primary/10 text-primary'} transition-colors`}><Upload className="w-7 h-7" /></div><h2 className="font-semibold text-app text-lg">{label}</h2><p className="text-sm text-muted mt-2">or click to browse · {acceptType === 'pdf' ? 'PDF files' : 'JPG, PNG, WebP'}</p></div>;
}

function ToolShell({ title, subtitle, icon, seoTitle, seoDescription, seoPath, children, jsonLd }: { title: string; subtitle: string; icon: ReactNode; seoTitle: string; seoDescription: string; seoPath: string; children: ReactNode; jsonLd?: object | object[] }) {
  useSeo({ title: seoTitle, description: seoDescription, path: seoPath, jsonLd });
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
      <div><h1 className="text-2xl sm:text-3xl font-bold text-app">{title}</h1><p className="text-muted text-sm mt-1 max-w-xl">{subtitle}</p></div>
    </div>
    {children}
  </div>;
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-12 pt-8 border-t border-app/40"><h2 className="text-xl font-bold text-app mb-4">{title}</h2><div className="space-y-3 text-sm text-muted leading-relaxed">{children}</div></section>;
}

function FaqList({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="space-y-2 mt-4">{faqs.map(([q, a], i) => <div key={i} className="card-surface overflow-hidden"><button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center justify-between text-left p-4 text-sm font-semibold text-app"><span>{q}</span><ChevronDown className={`w-4 h-4 text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} /></button>{open === i && <div className="px-4 pb-4 text-sm text-muted leading-relaxed animate-fade-in">{a}</div>}</div>)}</div>;
}

function RelatedTools({ links }: { links: { label: string; to: string; icon: ReactNode }[] }) {
  return <div className="mt-8 p-5 card-surface"><h3 className="text-sm font-bold text-app mb-3">Related tools</h3><div className="flex flex-wrap gap-2">{links.map((l) => <Link key={l.to} to={l.to} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app text-sm text-muted hover:text-primary transition-colors">{l.icon}{l.label}</Link>)}</div></div>;
}

function SegmentedControl({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-1 p-1 rounded-xl bg-app border border-app/50">
    {options.map((opt) => <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${value === opt.value ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-app'}`}>{opt.label}</button>)}
  </div>;
}

function SizeInput({ targetSize, setTargetSize, targetUnit, setTargetUnit }: { targetSize: string; setTargetSize: (v: string) => void; targetUnit: string; setTargetUnit: (v: string) => void }) {
  return <div>
    <label className="text-sm font-semibold text-app mb-2 block">Target file size</label>
    <div className="flex gap-2">
      <input type="number" value={targetSize} onChange={(e) => setTargetSize(e.target.value)} className="input-field flex-1" placeholder="e.g. 50" min="1" />
      <select value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="input-field w-24">
        <option value="KB">KB</option>
        <option value="MB">MB</option>
      </select>
    </div>
    <p className="text-xs text-muted mt-1.5">Leave empty to use quality slider instead</p>
  </div>;
}

function ResizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [quality, setQuality] = useState(82);
  const [unit, setUnit] = useState('px');
  const [locked, setLocked] = useState(true);
  const [beforeAfter, setBeforeAfter] = useState(50);
  const [done, setDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [targetSize, setTargetSize] = useState('');
  const [targetUnit, setTargetUnit] = useState('KB');
  const [outputInfo, setOutputInfo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const u = URL.createObjectURL(f);
    setUrl(u);
    setDone(false);
    setOutputInfo('');
    setErrorMsg('');
    const dims = await getImageDimensions(f);
    setWidth(dims.width);
    setHeight(dims.height);
  };

  const aspectRatio = useMemo(() => height > 0 ? width / height : 1, [width, height]);

  const updateWidth = (v: number) => {
    setWidth(v);
    if (locked) setHeight(Math.round(v / aspectRatio));
  };

  const updateHeight = (v: number) => {
    setHeight(v);
    if (locked) setWidth(Math.round(v * aspectRatio));
  };

  const displayWidth = useMemo(() => pxToUnit(width, unit), [width, unit]);
  const displayHeight = useMemo(() => pxToUnit(height, unit), [height, unit]);

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    setDone(false);
    try {
      const img = await loadImage(url);
      const targetBytes = targetSize ? (targetUnit === 'MB' ? parseFloat(targetSize) * 1024 * 1024 : parseFloat(targetSize) * 1024) : 0;

      let blob: Blob;
      if (targetBytes > 0) {
        const { compressToTargetSize } = await import('@/lib/imageUtils');
        blob = await compressToTargetSize(img, width, height, targetBytes, 'image/jpeg');
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality / 100);
        });
      }

      downloadBlob(blob, `phototools-${file.name.replace(/\.[^/.]+$/, '')}.jpg`);
      setOutputInfo(`Output: ${formatBytes(blob.size)}`);
      setDone(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not process the image. Please try again.');
    }
    setProcessing(false);
  };

  return <ToolShell title="Resize & Compress" subtitle="Resize by pixels, cm, or inches. Compress to an exact target file size." icon={<Maximize2 className="w-7 h-7" />} seoTitle="Resize & Compress Images Online — JPG, PNG, WebP" seoDescription="Resize images by pixels, centimeters, or inches and compress to an exact file size in KB or MB. Free, private, and works entirely in your browser. No uploads." seoPath="/resize" jsonLd={buildJsonLd('SoftwareApplication', { name: 'PhotoTools Resize & Compress', url: `${SITE_URL}/resize`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}>
    {!file ? <UploadZone onFiles={load} label="Drop an image to get started" /> : (
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-app truncate">{file.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{formatBytes(file.size)}</span>
              <button onClick={() => { setFile(null); setUrl(''); }} aria-label="Remove image" className="text-muted hover:text-rose-500"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img src={url} className="max-w-full max-h-full object-contain" alt="Original" />
            <div className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-lg pointer-events-none" style={{ width: `${beforeAfter}%` }}>
              <img src={url} className="h-full object-contain" style={{ width: `${100 / (beforeAfter / 100)}%`, maxWidth: 'none' }} alt="Preview" />
            </div>
            <div className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase bg-black/60 text-white rounded">Original</div>
            <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold uppercase bg-primary/90 text-white rounded">Preview</div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted mb-2"><span>Before</span><span>Drag to compare</span><span>After</span></div>
            <input type="range" min="0" max="100" value={beforeAfter} onChange={(e) => setBeforeAfter(+e.target.value)} aria-label="Before and after comparison slider" className="w-full" />
          </div>
        </div>
        <div className="card-surface p-5 space-y-5">
          <div>
            <label className="text-sm font-semibold text-app mb-2 block">Dimensions</label>
            <SegmentedControl options={[{ label: 'Pixels', value: 'px' }, { label: 'Centimeters', value: 'cm' }, { label: 'Inches', value: 'in' }]} value={unit} onChange={setUnit} />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end mt-3">
              <div><span className="text-xs text-muted">Width</span><input type="number" value={displayWidth} onChange={(e) => updateWidth(unitToPx(+e.target.value, unit))} className="input-field mt-1" /></div>
              <button onClick={() => setLocked(!locked)} aria-label={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'} className={`mb-1 w-9 h-9 rounded-lg flex items-center justify-center ${locked ? 'bg-primary/10 text-primary' : 'bg-app text-muted'}`}><Lock className="w-4 h-4" /></button>
              <div><span className="text-xs text-muted">Height</span><input type="number" value={displayHeight} onChange={(e) => updateHeight(unitToPx(+e.target.value, unit))} className="input-field mt-1" /></div>
            </div>
            <p className="text-xs text-muted mt-2">{width} × {height} px</p>
          </div>
          <SizeInput targetSize={targetSize} setTargetSize={setTargetSize} targetUnit={targetUnit} setTargetUnit={setTargetUnit} />
          {!targetSize && <div>
            <div className="flex justify-between mb-2"><label className="text-sm font-semibold text-app">Quality</label><span className="text-sm text-primary font-bold">{quality}%</span></div>
            <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(+e.target.value)} aria-label="Quality" className="w-full" />
          </div>}
          {outputInfo && <div role="status" className="p-3 rounded-xl bg-accent/10 text-xs text-accent flex gap-2 items-center"><Check className="w-4 h-4 shrink-0" /> {outputInfo}</div>}
          {errorMsg && <div role="alert" className="p-3 rounded-xl bg-rose-500/10 text-xs text-rose-500 flex gap-2 items-center"><AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}</div>}
          <button onClick={process} disabled={processing} className="btn-primary w-full justify-center">
            {processing ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : done ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {processing ? 'Processing...' : done ? 'Downloaded!' : 'Resize & Download'}
          </button>
        </div>
      </div>
    )}
      <InfoSection title="How image resizing works"><p>Resizing an image changes its pixel dimensions — the width and height measured in pixels. When you make an image smaller, the browser uses a canvas to sample and blend neighboring pixels, producing a smooth result. When you make it larger, the canvas interpolates between existing pixels to fill the gaps.</p><p>PhotoTools lets you specify dimensions in pixels (px), centimeters (cm), or inches (in). Centimeters and inches are converted to pixels using a standard screen resolution of 96 DPI, which is the default for most web and desktop displays.</p></InfoSection>
      <InfoSection title="Target file size compression"><p>Many online forms and portals require images under a specific file size — for example, 50 KB or 240 KB. PhotoTools uses a binary search algorithm that repeatedly adjusts JPEG quality until the output falls under your target. If reducing quality alone is not enough, it gradually shrinks the image dimensions until the target is met.</p><p>This means you get a file that meets the exact size requirement while preserving as much visual quality as possible.</p></InfoSection>
      <InfoSection title="JPG, PNG, and WebP explained"><p><strong>JPG (JPEG)</strong> is best for photographs and images with many colors. It uses lossy compression, which means some quality is lost to achieve a smaller file size. <strong>PNG</strong> is best for images with transparency or sharp edges like logos. It uses lossless compression — no quality loss, but larger files. <strong>WebP</strong> is a modern format that offers better compression than both JPG and PNG, though not all older systems support it.</p></InfoSection>
      <InfoSection title="Common use cases"><p>Resizing photos for online application forms, compressing images for email attachments, preparing product photos for e-commerce listings, creating web-optimized images for faster page loads, and reducing image size for social media uploads.</p></InfoSection>
      <InfoSection title="Privacy"><p>Your image is processed entirely in your browser using HTML5 Canvas. It is never uploaded to any server. When you close the tab, the processed image data is gone.</p></InfoSection>
      <FaqList faqs={[['What is the difference between resizing and compressing?', 'Resizing changes the pixel dimensions (width and height) of an image. Compressing reduces the file size by adjusting quality or using a more efficient encoding. You can do both at once with the target file size option.'], ['Why does my image have a white background after resizing?', 'JPG format does not support transparency. When you export as JPG, any transparent areas are filled with white. Use PNG if you need to preserve transparency.'], ['What dimensions should I use for web images?', 'For most web images, 1200px on the longest edge is a good starting point. For thumbnails, 400-600px is sufficient. Always compress to the smallest file size that still looks good.'], ['Can I resize multiple images at once?', 'Currently, PhotoTools processes one image at a time. This keeps the tool fast and simple. For batch processing, you can resize each image in quick succession.']]}/>
      <RelatedTools links={[{ label: 'Signature Resizer', to: '/signature', icon: <PenIcon /> }, { label: 'Images to PDF', to: '/pdf', icon: <FileText className="w-4 h-4" /> }, { label: 'Remove Background', to: '/background', icon: <Scissors className="w-4 h-4" /> }]} />
  </ToolShell>;
}

function SignatureTool() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [preset, setPreset] = useState('Custom');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(100);
  const [unit, setUnit] = useState('px');
  const [targetSize, setTargetSize] = useState('');
  const [targetUnit, setTargetUnit] = useState('KB');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [outputInfo, setOutputInfo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const presets: Record<string, { dims: [number, number]; size: string; unit: string }> = {
    'Government (India)': { dims: [300, 100], size: '20', unit: 'KB' },
    'Job application': { dims: [200, 80], size: '30', unit: 'KB' },
    'Passport form': { dims: [350, 150], size: '50', unit: 'KB' },
    'Custom': { dims: [300, 100], size: '', unit: 'KB' },
  };

  const load = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setDone(false);
    setOutputInfo('');
    setErrorMsg('');
  };

  const choose = (p: string) => {
    setPreset(p);
    setWidth(presets[p].dims[0]);
    setHeight(presets[p].dims[1]);
    setTargetSize(presets[p].size);
    setTargetUnit(presets[p].unit);
  };

  const displayWidth = useMemo(() => pxToUnit(width, unit), [width, unit]);
  const displayHeight = useMemo(() => pxToUnit(height, unit), [height, unit]);

  const download = async () => {
    if (!url || !file) return;
    setProcessing(true);
    setDone(false);
    setErrorMsg('');
    try {
      const img = await loadImage(url);
      const targetBytes = targetSize ? (targetUnit === 'MB' ? parseFloat(targetSize) * 1024 * 1024 : parseFloat(targetSize) * 1024) : 0;

      let blob: Blob;
      if (targetBytes > 0) {
        const { compressToTargetSize } = await import('@/lib/imageUtils');
        blob = await compressToTargetSize(img, width, height, targetBytes, 'image/jpeg');
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
        });
      }

      downloadBlob(blob, 'signature-resized.jpg');
      setOutputInfo(`Output: ${formatBytes(blob.size)}`);
      setDone(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not process the signature. Please try again.');
    }
    setProcessing(false);
  };

  return <ToolShell title="Signature Resizer" subtitle="Precise signature sizing with target file size limits for government and job forms." icon={<PenIcon />} seoTitle="Signature Resizer — Resize Signature to Exact KB & Dimensions" seoDescription="Resize your signature image to exact pixel dimensions and file size limits for government forms, job applications, and passport documents. Free and private." seoPath="/signature" jsonLd={buildJsonLd('SoftwareApplication', { name: 'PhotoTools Signature Resizer', url: `${SITE_URL}/signature`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}>
    {!file ? <UploadZone onFiles={load} label="Drop your signature image" /> : (
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="card-surface p-5">
          <div className="flex justify-between mb-4"><span className="text-sm font-semibold text-app">Preview</span><button onClick={() => setFile(null)} aria-label="Remove image" className="text-muted hover:text-rose-500"><X className="w-4 h-4" /></button></div>
          <div className="aspect-[3/2] rounded-xl bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] flex items-center justify-center overflow-hidden"><img src={url} className="max-w-full max-h-full object-contain" alt="Signature preview" /></div>
          <p className="text-xs text-muted text-center mt-3">{width} × {height} px · {targetSize ? `Target: ${targetSize} ${targetUnit}` : 'No size limit'}</p>
          {outputInfo && <div role="status" className="mt-3 p-3 rounded-xl bg-accent/10 text-xs text-accent flex gap-2 items-center"><Check className="w-4 h-4 shrink-0" /> {outputInfo}</div>}
          {errorMsg && <div role="alert" className="mt-3 p-3 rounded-xl bg-rose-500/10 text-xs text-rose-500 flex gap-2 items-center"><AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}</div>}
        </div>
        <div className="card-surface p-5 space-y-5">
          <div>
            <label className="text-sm font-semibold text-app mb-2 block">Standard presets</label>
            <div className="space-y-2">{Object.keys(presets).map((p) => <button key={p} onClick={() => choose(p)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${preset === p ? 'bg-primary/10 text-primary font-semibold' : 'bg-app text-muted hover:text-app'}`}>{p}<span className="float-right text-xs opacity-70">{presets[p].dims[0]}×{presets[p].dims[1]}px{presets[p].size && ` · ${presets[p].size}${presets[p].unit}`}</span></button>)}</div>
          </div>
          <div>
            <label className="text-sm font-semibold text-app mb-2 block">Dimensions</label>
            <SegmentedControl options={[{ label: 'Pixels', value: 'px' }, { label: 'Centimeters', value: 'cm' }, { label: 'Inches', value: 'in' }]} value={unit} onChange={setUnit} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><span className="text-xs text-muted">Width</span><input type="number" value={displayWidth} onChange={(e) => { setWidth(unitToPx(+e.target.value, unit)); setPreset('Custom'); }} className="input-field mt-1" /></div>
              <div><span className="text-xs text-muted">Height</span><input type="number" value={displayHeight} onChange={(e) => { setHeight(unitToPx(+e.target.value, unit)); setPreset('Custom'); }} className="input-field mt-1" /></div>
            </div>
          </div>
          <SizeInput targetSize={targetSize} setTargetSize={(v) => { setTargetSize(v); setPreset('Custom'); }} targetUnit={targetUnit} setTargetUnit={(v) => { setTargetUnit(v); setPreset('Custom'); }} />
          <button onClick={download} disabled={processing} className="btn-primary w-full justify-center">
            {processing ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : done ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {processing ? 'Processing...' : done ? 'Downloaded!' : 'Download signature'}
          </button>
        </div>
      </div>
    )}
      <InfoSection title="What is signature resizing?"><p>Signature resizing is the process of adjusting a scanned or photographed signature image to meet exact dimension and file-size requirements set by institutions. Many government portals, job application websites, and exam registration forms specify that the signature must be a certain width by height in pixels and must not exceed a file size limit in KB.</p></InfoSection>
      <InfoSection title="Exact dimensions and file-size limits"><p>Different forms have different requirements. For example, many Indian government applications require signatures to be 300×100 pixels and under 20 KB. Job application portals may ask for 200×80 pixels under 30 KB. PhotoTools includes presets for common requirements and lets you set custom dimensions and file-size targets for any form.</p></InfoSection>
      <InfoSection title="JPG vs PNG for signatures"><p>Most online forms require signatures in JPG format because it produces smaller files. PNG is supported but results in larger file sizes due to lossless compression. If your form does not specify a format, JPG is the safer choice. PhotoTools exports signatures as JPG by default.</p></InfoSection>
      <InfoSection title="Common signature upload problems"><p>If your signature is being rejected by a form, the most common causes are: file size exceeding the limit, wrong pixel dimensions, or incorrect file format. Use the target file size field to ensure your output is under the required limit, and check the pixel dimensions display to confirm they match the form requirements.</p></InfoSection>
      <InfoSection title="Privacy"><p>Your signature is processed entirely in your browser. It is never uploaded to a server, stored, or shared. When you close the tab, the image data is gone.</p></InfoSection>
      <FaqList faqs={[['Why is my signature file still too large after resizing?', 'Make sure you have set a target file size. Without a target, the tool uses a default quality level that may not meet your requirement. Enter the KB limit in the target file size field and the tool will automatically adjust quality and dimensions to meet it.'], ['What format should I use for my signature?', 'Most forms require JPG. If your form accepts PNG, use it for sharper edges, but expect a larger file size.'], ['How do I scan my signature for upload?', 'Sign on white paper, photograph or scan it, then crop the image to the signature area. Upload the cropped image to PhotoTools and resize it to your form requirements.'], ['Can I use this for passport and visa applications?', 'Yes. Check the specific dimension and file-size requirements on your application portal, then use the custom dimensions and target file size fields to match them exactly.']]}/>
      <RelatedTools links={[{ label: 'Resize & Compress', to: '/resize', icon: <Maximize2 className="w-4 h-4" /> }, { label: 'Images to PDF', to: '/pdf', icon: <FileText className="w-4 h-4" /> }, { label: 'Remove Background', to: '/background', icon: <Scissors className="w-4 h-4" /> }]} />
  </ToolShell>;
}

function PdfTool() {
  const [tab, setTab] = useState<'image-to-pdf' | 'pdf-compress'>('image-to-pdf');

  return <ToolShell title="PDF Tools" subtitle="Convert images to PDF with filters, or compress an existing PDF to a smaller size." icon={<FileText className="w-7 h-7" />} seoTitle="JPG to PDF & PDF Compressor Online" seoDescription="Convert JPG, PNG, and WebP images into a single PDF document, or compress an existing PDF to a smaller file size. All processing happens locally in your browser. No uploads." seoPath="/pdf" jsonLd={buildJsonLd('SoftwareApplication', { name: 'PhotoTools PDF Tools', url: `${SITE_URL}/pdf`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}>
    <div className="flex gap-1 p-1 rounded-xl bg-app border border-app/50 mb-6 max-w-md mx-auto">
      <button onClick={() => setTab('image-to-pdf')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'image-to-pdf' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-app'}`}><ImageIcon className="w-4 h-4" /> Image to PDF</button>
      <button onClick={() => setTab('pdf-compress')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'pdf-compress' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-app'}`}><Layers className="w-4 h-4" /> PDF Compress</button>
    </div>
    {tab === 'image-to-pdf' ? <ImageToPdfTool /> : <PdfCompressTool />}
      <InfoSection title="Image to PDF conversion"><p>The Image to PDF tool lets you combine multiple JPG, PNG, WebP, or BMP images into a single PDF document. Each image becomes one page. You can reorder pages by dragging the arrows, apply filters like black-and-white or document enhancement, and download the finished PDF — all without uploading anything to a server.</p></InfoSection>
      <InfoSection title="PDF compression explained"><p>PDF files can be large because they contain high-resolution images and embedded fonts. The PDF Compress tool reduces file size by re-encoding images at lower quality and removing redundant data. You can set a target file size or let the tool aim for a 50% reduction by default. The compression happens entirely in your browser.</p></InfoSection>
      <InfoSection title="Quality considerations"><p>When compressing a PDF, there is a trade-off between file size and visual quality. Lower file sizes mean more compression, which can make images appear blurry or pixelated. For documents that will be printed, use a higher target size. For documents that will be viewed on screen or sent by email, a smaller target is usually fine.</p></InfoSection>
      <InfoSection title="Privacy and local processing"><p>All PDF conversion and compression happens in your browser using JavaScript libraries. Your images and PDF files are never uploaded to a server. The processing uses your device CPU, so very large PDFs may take longer on low-powered devices.</p></InfoSection>
      <FaqList faqs={[['How many images can I add to one PDF?', 'There is no hard limit, but for best performance keep it under 50 images. Very large PDFs take longer to generate and may use significant memory on mobile devices.'], ['Can I reorder pages in my PDF?', 'Yes. Use the arrow buttons on each page thumbnail to move pages left or right before generating the PDF.'], ['What does the Document/Scan filter do?', 'It converts images to black-and-white with increased contrast and brightness, which is useful for scanned documents that need to look clean and legible.'], ['How much can I compress a PDF?', 'The amount of compression depends on the content. PDFs with many high-resolution images can be reduced significantly. PDFs that are mostly text may not shrink much. Set a target file size and the tool will try to meet it.']]}/>
      <RelatedTools links={[{ label: 'Resize & Compress', to: '/resize', icon: <Maximize2 className="w-4 h-4" /> }, { label: 'Signature Resizer', to: '/signature', icon: <PenIcon /> }, { label: 'Remove Background', to: '/background', icon: <Scissors className="w-4 h-4" /> }]} />
  </ToolShell>;
}

function ImageToPdfTool() {
  const [items, setItems] = useState<PdfPageItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState<ImageFilter>('original');
  const [progress, setProgress] = useState('');

  const add = (files: File[]) => {
    setItems((prev) => [...prev, ...files.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) }))]);
    setDone(false);
  };
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));
  const move = (i: number, dir: number) => setItems((p) => {
    const copy = [...p];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return p;
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  const generate = async () => {
    if (items.length === 0) return;
    setGenerating(true);
    setDone(false);
    try {
      const { downloadImagePdf } = await import('@/lib/pdfUtils');
      await downloadImagePdf(items, filter, 'phototools-document.pdf', (current, total) => {
        setProgress(`Processing page ${current} of ${total}...`);
      });
      setDone(true);
      setProgress('');
    } catch (err) {
      console.error(err);
      setProgress('Error generating PDF');
    }
    setGenerating(false);
  };

  return <>
    {items.length === 0 ? <UploadZone onFiles={add} multiple label="Drop images to build your PDF" /> : (
      <div>
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div><h2 className="font-bold text-app text-lg">Your pages <span className="text-muted font-normal">({items.length})</span></h2><p className="text-xs text-muted mt-1">Use arrows to reorder pages</p></div>
            <button onClick={() => document.querySelector<HTMLInputElement>('#pdf-add')?.click()} className="btn-ghost text-primary text-sm"><Plus className="w-4 h-4" /> Add more</button>
            <input id="pdf-add" type="file" multiple accept="image/*" className="sr-only" onChange={(e) => add(Array.from(e.target.files || []))} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <div key={item.id} className="group relative rounded-xl border border-app overflow-hidden bg-app">
                <div className="aspect-[3/4] flex items-center justify-center p-2"><img src={item.url} alt={`Page ${i + 1}`} className="max-w-full max-h-full object-contain" /></div>
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-surface/90 text-app text-xs font-bold flex items-center justify-center">{i + 1}</div>
                <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move page left" className="w-8 h-8 bg-surface/95 rounded-lg flex items-center justify-center text-app disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => remove(item.id)} aria-label="Remove page" className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center"><X className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move page right" className="w-8 h-8 bg-surface/95 rounded-lg flex items-center justify-center text-app disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface p-5 mb-4">
          <label className="text-sm font-semibold text-app mb-3 block">Image filter</label>
          <div className="flex gap-2">
            {([['original', 'Original'], ['grayscale', 'Black & White'], ['document', 'Document/Scan']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${filter === val ? 'bg-primary text-white' : 'bg-app text-muted hover:text-app'}`}>{label}</button>
            ))}
          </div>
        </div>
        {progress && <p aria-live="polite" className="text-sm text-primary text-center mb-4">{progress}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={generate} disabled={generating} className="btn-primary justify-center flex-1">
            {generating ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : done ? <Check className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : done ? 'Downloaded!' : 'Download PDF'}
          </button>
          <button onClick={() => setItems([])} className="btn-ghost border border-app/50">Clear all</button>
        </div>
      </div>
    )}
  </>;
}

function PdfCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState('');
  const [targetUnit, setTargetUnit] = useState('KB');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState('');
  const [outputInfo, setOutputInfo] = useState('');

  const load = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setOutputInfo('');
  };

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    setDone(false);
    try {
      const targetBytes = targetSize ? (targetUnit === 'MB' ? parseFloat(targetSize) * 1024 * 1024 : parseFloat(targetSize) * 1024) : file.size * 0.5;
      const { compressPdf } = await import('@/lib/pdfUtils');
      const blob = await compressPdf(file, targetBytes, (current, total) => {
        setProgress(`Processing page ${current} of ${total}...`);
      });
      downloadBlob(blob, `phototools-compressed-${file.name}`);
      setOutputInfo(`Original: ${formatBytes(file.size)} → Compressed: ${formatBytes(blob.size)}`);
      setDone(true);
      setProgress('');
    } catch (err) {
      console.error(err);
      setProgress('Error compressing PDF');
    }
    setProcessing(false);
  };

  return <>
    {!file ? <UploadZone onFiles={load} label="Drop a PDF to compress" acceptType="pdf" /> : (
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div><span className="text-sm font-semibold text-app truncate block">{file.name}</span><span className="text-xs text-muted">{formatBytes(file.size)}</span></div>
            <button onClick={() => setFile(null)} aria-label="Remove file" className="text-muted hover:text-rose-500"><X className="w-4 h-4" /></button>
          </div>
          <div className="aspect-[3/4] max-w-xs mx-auto rounded-xl bg-surface border border-app/50 flex items-center justify-center">
            <FileText className="w-16 h-16 text-muted/40" />
          </div>
          {outputInfo && <div className="mt-4 p-3 rounded-xl bg-accent/10 text-xs text-accent flex gap-2 items-center"><Check className="w-4 h-4 shrink-0" /> {outputInfo}</div>}
        </div>
        <div className="card-surface p-5 space-y-5">
          <SizeInput targetSize={targetSize} setTargetSize={setTargetSize} targetUnit={targetUnit} setTargetUnit={setTargetUnit} />
          <div className="p-3 rounded-xl bg-primary/5 text-xs text-muted flex gap-2"><Info className="w-4 h-4 text-primary shrink-0" /> Leave empty for balanced compression (50% reduction target).</div>
          {progress && <p aria-live="polite" className="text-sm text-primary">{progress}</p>}
          <button onClick={compress} disabled={processing} className="btn-primary w-full justify-center">
            {processing ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : done ? <Check className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
            {processing ? 'Compressing...' : done ? 'Downloaded!' : 'Compress & Download'}
          </button>
        </div>
      </div>
    )}
  </>;
}

let bgRemovalModulePromise: Promise<typeof import('@imgly/background-removal')> | null = null;
function getBgRemovalModule() {
  if (!bgRemovalModulePromise) {
    bgRemovalModulePromise = import('@imgly/background-removal').catch((err) => {
      bgRemovalModulePromise = null;
      throw err;
    });
  }
  return bgRemovalModulePromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function downscaleForBgRemoval(file: File, maxDim: number): Promise<Blob> {
  const objUrl = URL.createObjectURL(file);
  let img: HTMLImageElement | null = null;
  try {
    img = await loadImage(objUrl);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= maxDim) return file;
    const scale = maxDim / longest;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.92);
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return blob;
  } catch {
    return file;
  } finally {
    if (img) img.src = '';
    URL.revokeObjectURL(objUrl);
  }
}

function getBgRemovalMaxDims(): number[] {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const memory = nav.deviceMemory;
  if (memory !== undefined && memory >= 4) return [1200, 768, 512];
  if (memory !== undefined && memory < 4) return [768, 512];
  if (!isMobile) return [1200, 768, 512];
  return [768, 512];
}

function BackgroundTool() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'image'>('transparent');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [aiProgress, setAiProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);
  const urlRef = useRef('');
  const resultUrlRef = useRef('');
  const bgImageUrlRef = useRef('');
  const jobIdRef = useRef(0);

  const presetColors = [
    { name: 'White', color: '#FFFFFF' },
    { name: 'Light Blue', color: '#A0C4FF' },
    { name: 'Neutral Grey', color: '#E5E5E5' },
    { name: 'Passport Blue', color: '#1e40af' },
    { name: 'Red', color: '#dc2626' },
    { name: 'Green', color: '#16a34a' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('phototools-bg-type');
    const savedColor = localStorage.getItem('phototools-bg-color');
    if (saved === 'color' || saved === 'transparent' || saved === 'image') setBgType(saved);
    if (savedColor) setBgColor(savedColor);
  }, []);

  useEffect(() => { urlRef.current = url; }, [url]);
  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => { bgImageUrlRef.current = bgImageUrl; }, [bgImageUrl]);
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
    };
  }, []);

  const saveBgSettings = (type: string, color: string) => {
    localStorage.setItem('phototools-bg-type', type);
    localStorage.setItem('phototools-bg-color', color);
  };

  const load = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = ''; }
    setFile(f);
    const newUrl = URL.createObjectURL(f);
    urlRef.current = newUrl;
    setUrl(newUrl);
    setRemoved(false);
    setResultUrl('');
    setErrorMsg('');
    setAiProgress('');
  };

  const removeBackground = async () => {
    if (!file || processingRef.current) return;
    processingRef.current = true;
    const myJobId = ++jobIdRef.current;
    setProcessing(true);
    setErrorMsg('');
    setAiProgress('Preparing image...');

    const maxDims = getBgRemovalMaxDims();
    let succeeded = false;
    let lastErr: unknown = null;
    try {
      for (const maxDim of maxDims) {
        if (myJobId !== jobIdRef.current) break;
        try {
          const input = await downscaleForBgRemoval(file, maxDim);
          if (myJobId !== jobIdRef.current) break;
          if (maxDim === maxDims[0]) {
            setAiProgress('Loading AI model...');
          } else {
            setAiProgress('Retrying with smaller image...');
          }
          const mod = await getBgRemovalModule();
          if (myJobId !== jobIdRef.current) break;
          setAiProgress('AI is processing your image...');
          const result = await withTimeout(mod.removeBackground(input, {
            model: 'isnet_quint8',
            device: 'cpu',
            output: { format: 'image/png' },
            progress: (key: string, current: number, total: number) => {
              if (myJobId !== jobIdRef.current) return;
              if (key.includes('download') && total > 0) {
                setAiProgress(`Loading AI model... ${Math.round((current / total) * 100)}%`);
              } else {
                setAiProgress('AI is processing your image...');
              }
            },
          }), 180000);
          if (myJobId !== jobIdRef.current) break;
          if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
          const newUrl = URL.createObjectURL(result as Blob);
          resultUrlRef.current = newUrl;
          setResultUrl(newUrl);
          setRemoved(true);
          succeeded = true;
          break;
        } catch (err) {
          console.error(`Background removal failed at maxDim=${maxDim}:`, err);
          lastErr = err;
        }
      }
      if (!succeeded && myJobId === jobIdRef.current) {
        let msg: string;
        if (lastErr instanceof Error && lastErr.message === 'timeout') {
          msg = 'Background removal is taking too long. Please try a smaller image or try again.';
        } else if (lastErr instanceof Error && (lastErr.message.includes('fetch') || lastErr.message.includes('network'))) {
          msg = 'Background removal could not be loaded. Please check your connection and try again.';
        } else {
          msg = 'Background removal could not process this image. Please try a smaller image.';
        }
        setErrorMsg(msg);
      }
    } finally {
      if (myJobId === jobIdRef.current) {
        processingRef.current = false;
        setProcessing(false);
        setAiProgress('');
      }
    }
  };

  useEffect(() => {
    if (!removed || !resultUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      if (bgType === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'image' && bgImageUrl) {
        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        bgImg.onerror = () => {
          ctx.drawImage(img, 0, 0);
        };
        bgImg.src = bgImageUrl;
        return;
      }
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => {
      console.error('Failed to load result image for canvas rendering');
    };
    img.src = resultUrl;
  }, [removed, resultUrl, bgType, bgColor, bgImageUrl]);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files || !files[0]) return;
    if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
    const newBgUrl = URL.createObjectURL(files[0]);
    bgImageUrlRef.current = newBgUrl;
    setBgImageUrl(newBgUrl);
    setBgType('image');
    saveBgSettings('image', bgColor);
    e.target.value = '';
  };

  const applyBgColor = (color: string) => {
    setBgColor(color);
    setBgType('color');
    saveBgSettings('color', color);
  };

  const downloadResult = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'phototools-cutout.png');
    }, 'image/png');
  };

  const resetAll = (e: React.MouseEvent) => {
    e.preventDefault();
    jobIdRef.current++;
    processingRef.current = false;
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ''; }
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = ''; }
    if (bgImageUrlRef.current) { URL.revokeObjectURL(bgImageUrlRef.current); bgImageUrlRef.current = ''; }
    setFile(null);
    setUrl('');
    setRemoved(false);
    setResultUrl('');
    setErrorMsg('');
    setAiProgress('');
    setProcessing(false);
  };

  const startOver = (e: React.MouseEvent) => {
    e.preventDefault();
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = ''; }
    setRemoved(false);
    setResultUrl('');
  };

  const setTransparent = (e: React.MouseEvent) => {
    e.preventDefault();
    setBgType('transparent');
    saveBgSettings('transparent', bgColor);
  };

  return <ToolShell title="Remove Background" subtitle="Remove backgrounds and apply custom colors or images. Your settings are saved for next time." icon={<Scissors className="w-7 h-7" />} seoTitle="Remove Image Background Online — Free AI Background Remover" seoDescription="Remove the background from any photo using on-device AI. Replace it with a solid color, custom image, or keep it transparent. No uploads required. Free and private." seoPath="/background" jsonLd={buildJsonLd('SoftwareApplication', { name: 'PhotoTools Background Remover', url: `${SITE_URL}/background`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}>
    {!file ? <><div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-5 flex gap-3 text-sm text-emerald-700 dark:text-emerald-300"><Shield className="w-5 h-5 shrink-0" /><span><strong>Privacy-first processing.</strong> Everything happens entirely on your device. No images are uploaded.</span></div><UploadZone onFiles={load} label="Drop an image to remove its background" /></> : (
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-5"><div><h2 className="font-bold text-app text-lg">Background studio</h2><p className="text-xs text-muted mt-1">{removed ? 'Background removed — apply a new backdrop below' : 'Remove the background, then customize'}</p></div><button type="button" onClick={resetAll} aria-label="Remove image" className="text-muted hover:text-rose-500"><X className="w-4 h-4" /></button></div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0px] flex items-center justify-center">
            {!removed ? <img src={url} alt="Background editor" className="max-w-full max-h-full object-contain" /> : <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />}
          </div>
        </div>
        <div className="space-y-4">
          {!removed ? <>
            <div className="p-3 rounded-xl bg-primary/5 text-xs text-muted leading-relaxed"><MousePointer2 className="w-4 h-4 text-primary mb-2" />Our AI model isolates the subject (person, product, object) and removes the background — just like remove.bg. First run downloads the model (~40 MB), subsequent runs are instant.</div>
            {processing && aiProgress && <div aria-live="polite" className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3"><RefreshCw className="w-5 h-5 text-primary animate-spin-slow shrink-0" /><span className="text-sm font-semibold text-primary">{aiProgress}</span></div>}
            {errorMsg && <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-sm text-rose-500"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
            <button type="button" onClick={removeBackground} disabled={processing} className="btn-primary w-full justify-center">{processing ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : <Wand2 className="w-4 h-4" />}{processing ? 'Removing...' : 'Remove background'}</button>
          </> : <>
            <div>
              <label className="text-sm font-semibold text-app mb-3 block">New background</label>
              <div className="space-y-2">
                <button type="button" onClick={setTransparent} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${bgType === 'transparent' ? 'bg-primary/10 text-primary font-semibold' : 'bg-app text-muted'}`}>Transparent</button>
                {presetColors.map((pc) => <button type="button" key={pc.color} onClick={(e) => { e.preventDefault(); applyBgColor(pc.color); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${bgType === 'color' && bgColor === pc.color ? 'bg-primary/10 text-primary font-semibold' : 'bg-app text-muted'}`}><span className="w-5 h-5 rounded border border-app/50 inline-block" style={{ background: pc.color }} />{pc.name}</button>)}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-app">
                  <input type="color" value={bgColor} onChange={(e) => applyBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <span className="text-sm text-muted">Custom color</span>
                </div>
                <label className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-app text-muted hover:text-app cursor-pointer flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Upload background image<input type="file" accept="image/*" className="sr-only" onChange={handleBgImageUpload} /></label>
              </div>
            </div>
            {bgType !== 'transparent' && <p className="text-xs text-accent flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Saved as your default background</p>}
            <button type="button" onClick={startOver} className="btn-ghost border border-app/50 w-full justify-center"><Eraser className="w-4 h-4" /> Start over</button>
            <button type="button" onClick={downloadResult} className="btn-primary w-full justify-center"><Download className="w-4 h-4" /> Download result</button>
          </>}
        </div>
      </div>
    )}
      <InfoSection title="How background removal works"><p>PhotoTools uses an AI model called IS-Net (Image Segmentation Network) that runs directly in your browser via WebAssembly. The model analyzes the image and identifies the foreground subject — a person, product, or object — then produces a transparency mask that separates the subject from the background.</p><p>On first use, the model file (about 40 MB) is downloaded and cached by your browser. Subsequent uses load from cache, making them much faster. All processing happens on your device CPU.</p></InfoSection>
      <InfoSection title="Transparent PNG and background replacement"><p>After removing the background, you can download the result as a transparent PNG, or apply a new background. Choose from preset colors, a custom color, or upload your own background image. The result is composited on a canvas and downloaded as a PNG file.</p></InfoSection>
      <InfoSection title="Supported use cases"><p>Creating product photos with clean white backgrounds for e-commerce, removing backgrounds from portraits for ID photos, preparing images for presentations with custom colored backgrounds, and creating transparent overlays for graphic design projects.</p></InfoSection>
      <InfoSection title="Limitations"><p>The AI model works best with clear foreground subjects and distinct backgrounds. Very complex images with multiple subjects, hair or fur with fine detail, or backgrounds similar in color to the subject may produce less precise results. Large images are automatically optimized before processing — powerful devices can handle up to 1200px, while lower-memory devices use a smaller size for stability. This may slightly reduce edge detail on very high-resolution photos.</p></InfoSection>
      <InfoSection title="Privacy"><p>Background removal runs entirely on your device. The AI model is downloaded once and cached by your browser. Your images are never uploaded to any server. The only network request is the initial model download.</p></InfoSection>
      <FaqList faqs={[['Why does the first run take longer?', 'The first time you use background removal, the browser downloads the AI model file (about 40 MB). This is cached for future use, so subsequent runs are much faster.'], ['Why is the result blurry around the edges?', 'Large images are automatically optimized before processing — up to 1200px on powerful devices, or smaller on lower-memory devices for stability. If your original image is very high resolution, the edges may lose some detail. For best results, use images that are already close to 1200px on the longest edge.'], ['Can I use a custom background image?', 'Yes. After removing the background, upload any image as a new background. The tool will composite your subject onto the uploaded background.'], ['Does background removal work on mobile?', 'Yes, but it may be slower on devices with limited RAM. The model requires about 40 MB of memory to run. If your device struggles, try using a smaller image.']]}/>
      <RelatedTools links={[{ label: 'Resize & Compress', to: '/resize', icon: <Maximize2 className="w-4 h-4" /> }, { label: 'Signature Resizer', to: '/signature', icon: <PenIcon /> }, { label: 'Images to PDF', to: '/pdf', icon: <FileText className="w-4 h-4" /> }]} />
  </ToolShell>;
}

function StaticPage({ type }: { type: 'about' | 'privacy' | 'terms' }) {
  const content = {
    about: { title: 'About PhotoTools', subtitle: 'Thoughtful tools for the way you work with images.', body: <><h2>What PhotoTools is</h2><p>PhotoTools is a free collection of browser-based image utilities. It includes tools for resizing and compressing images, resizing signatures for forms, converting images to PDF, and removing image backgrounds using AI. Every tool runs entirely in your browser — no software to install, no account to create.</p><h2>Why it was created</h2><p>Everyday image tasks should be simple. Most online image tools require uploads, accounts, or add watermarks. PhotoTools was built to offer an alternative: focused, well-designed utilities that respect your privacy and work without friction.</p><h2>How browser-based processing works</h2><p>PhotoTools uses HTML5 Canvas, the File API, and WebAssembly to process images directly on your device. When you select a file, it is loaded into your browser memory and processed using JavaScript. The file is never sent to a remote server. For background removal, an AI model is downloaded once and cached by your browser for future use.</p><h2>Privacy philosophy</h2><p>Your images stay on your device. PhotoTools does not upload, store, or transmit your image files. The only network requests the website makes are for loading the page, serving advertisements if enabled, and the initial AI model download for background removal. No account is required, and no personal information is collected to use the tools.</p><h2>What PhotoTools does not do</h2><p>PhotoTools does not require an account. It does not upload your images. It does not add watermarks. It does not track the content of your files. It does not store processed images on any server.</p><h2>Current tools</h2><p>The current toolkit includes four tools: <Link to="/resize" className="text-primary hover:underline">Resize & Compress</Link> for resizing images by pixels, centimeters, or inches and compressing to exact file sizes; <Link to="/signature" className="text-primary hover:underline">Signature Resizer</Link> for sizing signatures to form requirements; <Link to="/pdf" className="text-primary hover:underline">PDF Tools</Link> for converting images to PDF and compressing existing PDFs; and <Link to="/background" className="text-primary hover:underline">Remove Background</Link> for AI-powered background removal.</p><h2>Contact</h2><p>If you have a question or feedback, email us at phototool07@gmail.com or visit our <Link to="/contact" className="text-primary hover:underline">contact page</Link>.</p></> },
    privacy: { title: 'Privacy Policy', subtitle: 'Your privacy is not a feature. It is the foundation.', body: <><h2>Local image processing</h2><p>PhotoTools processes your images entirely within your web browser using HTML5 Canvas, the File API, and WebAssembly. When you use any of our tools, your selected files are loaded into your browser memory and processed on your device. Your images are not intentionally uploaded to, stored on, or accessible by PhotoTools servers.</p><h2>Website network requests</h2><p>While your image data stays on your device, the PhotoTools website itself does make some network requests: loading the page and its assets (HTML, CSS, JavaScript), loading external fonts if configured, serving advertisements through third-party ad networks if enabled, and downloading the AI model file for background removal on first use. This model is cached by your browser for subsequent uses.</p><h2>Information we do not collect</h2><p>We do not collect your photos, image metadata, personal identity information, or the content of files processed through our tools. No account is required to use any feature.</p><h2>Cookies and local storage</h2><p>PhotoTools uses browser local storage to remember your preferred background removal settings (background type and color). This data never leaves your device and can be cleared at any time through your browser settings. If advertising is enabled, third-party advertising services may use cookies or similar technologies as described below.</p><h2>Third-party advertising</h2><p>We may display advertisements to support the free service. Third-party advertising services, such as Google AdSense, may use cookies, device identifiers, or similar technologies to serve and measure ads based on your prior visits to this site or other sites. You can opt out of personalized advertising by visiting Google Ads Settings or your browser privacy settings. These third parties operate under their own privacy policies, and PhotoTools does not control or access the data they collect.</p><h2>Analytics</h2><p>If analytics are added in the future, they will be limited to aggregate, anonymous usage statistics (page views, tool usage counts) and will not track personal information or image content. This section will be updated if analytics are implemented.</p><h2>Third-party services</h2><p>PhotoTools uses the following third-party resources: web fonts loaded from Google Fonts (if configured), advertisement services if enabled, and the @imgly/background-removal library which downloads an AI model file on first use. Each of these services operates under its own privacy policy.</p><h2>Contact</h2><p>If you have a privacy question, contact us at phototool07@gmail.com.</p><h2>Policy updates</h2><p>We may update this privacy policy as the service evolves. Any changes will be reflected on this page. Continued use of PhotoTools after changes means you accept the updated policy.</p></> },
    terms: { title: 'Terms & Disclaimer', subtitle: 'Clear, fair, and straightforward.', body: <><h2>Acceptance</h2><p>By using PhotoTools, you agree to these terms. If you do not agree, please do not use the service.</p><h2>Permitted use</h2><p>PhotoTools is provided as a free utility for personal and commercial use. You may use the tools to process images for which you have the necessary rights.</p><h2>Prohibited use</h2><p>You may not use PhotoTools to process images that you do not have the right to use, or in a way that infringes on the rights of others. You may not attempt to disrupt, reverse-engineer, or overload the service.</p><h2>User responsibility</h2><p>You are responsible for the images you process and for keeping original copies of important files. PhotoTools processes images in your browser and does not store copies — if you close the tab without downloading, your processed data is lost.</p><h2>Image ownership and copyright</h2><p>You retain full ownership and copyright of any images you process with PhotoTools. We do not claim any rights to your content.</p><h2>Third-party services</h2><p>The website may load third-party resources such as fonts, advertisement scripts, and the AI model for background removal. These services operate under their own terms and privacy policies.</p><h2>Accuracy</h2><p>We work to keep our tools accurate, but results may vary based on your browser, device, available memory, and the quality of the source file. We do not guarantee specific output quality or file sizes.</p><h2>Availability</h2><p>PhotoTools is provided as-is without guarantees of availability. We may modify, update, or discontinue features at any time without notice.</p><h2>Downloads</h2><p>Processed files are downloaded directly to your device. PhotoTools does not store or retain downloaded files on any server.</p><h2>Limitation of liability</h2><p>To the fullest extent permitted by law, PhotoTools is not liable for any loss or damage arising from the use of these tools. Always keep an original copy of important files before processing.</p><h2>Changes to these terms</h2><p>We may update these terms as the service evolves. Continued use of PhotoTools after changes means you accept the updated terms.</p><h2>Contact</h2><p>If you have a question about these terms, contact us at phototool07@gmail.com.</p></> },
  }[type];
  const seoConfig = {
    about: { title: 'About PhotoTools — Free Online Image Tools', description: 'PhotoTools is a collection of free, privacy-first image utilities that run entirely in your browser. No uploads, no accounts, no watermarks.', path: '/about' },
    privacy: { title: 'Privacy Policy | PhotoTools', description: 'PhotoTools processes all images locally in your browser. We never upload or store your files. Read our full privacy policy covering local processing, advertising, and data practices.', path: '/privacy' },
    terms: { title: 'Terms of Use | PhotoTools', description: 'PhotoTools is a free utility for personal and commercial use. Read our terms and disclaimer for full details on usage, responsibility, and limitations.', path: '/terms' },
  }[type];
  useSeo({ title: seoConfig.title, description: seoConfig.description, path: seoConfig.path });
  return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16"><div className="text-center mb-12"><div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">{type === 'about' ? <Sparkles /> : type === 'privacy' ? <Shield /> : <FileText />}</div><h1 className="text-4xl font-bold text-app">{content.title}</h1><p className="text-muted mt-3">{content.subtitle}</p></div><article className="card-surface p-6 sm:p-10 prose prose-slate dark:prose-invert max-w-none prose-headings:text-app prose-p:text-muted prose-p:leading-relaxed">{content.body}</article></div>;
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  useSeo({ title: 'Contact PhotoTools', description: 'Have a question, idea, or need help with a PhotoTools feature? Email us at phototool07@gmail.com. We do not use a contact form that collects personal information.', path: '/contact' });
  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const mailtoHref = () => {
    const subject = form.subject || 'PhotoTools inquiry';
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`;
    return `mailto:phototool07@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError('Please fill in your name, email, and message.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setError('');
    window.location.href = mailtoHref();
  };
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16"><div className="text-center mb-12"><div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5"><Mail /></div><h1 className="text-4xl font-bold text-app">We're here to help</h1><p className="text-muted mt-3">Have a question, idea, or just want to say hello?</p></div><div className="grid md:grid-cols-[.8fr_1.2fr] gap-6"><div className="card-surface p-6 h-fit space-y-5"><div><MessageCircle className="w-5 h-5 text-primary mb-3" /><h3 className="font-bold text-app">Email us</h3><p className="text-sm text-muted mt-1">phototool07@gmail.com</p></div><div className="p-4 rounded-xl bg-primary/5 text-sm text-muted"><Shield className="w-4 h-4 text-accent inline mr-2" />No files are ever sent with your message. The form opens your email app — your message is not sent through our servers.</div></div><div className="card-surface p-6 sm:p-8"><p className="text-sm text-muted mb-4">Use the form below to compose your message. When you click send, it will open your email app with the message pre-filled. You can also email us directly at <a href="mailto:phototool07@gmail.com" className="text-primary hover:underline">phototool07@gmail.com</a>.</p><form onSubmit={submit} className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="contact-name" className="text-sm font-semibold text-app block mb-1.5">Your name</label><input id="contact-name" name="name" value={form.name} onChange={update} className="input-field" placeholder="Jane Smith" /></div><div><label htmlFor="contact-email" className="text-sm font-semibold text-app block mb-1.5">Email address</label><input id="contact-email" name="email" type="email" value={form.email} onChange={update} className="input-field" placeholder="jane@example.com" /></div></div><div><label htmlFor="contact-subject" className="text-sm font-semibold text-app block mb-1.5">Subject</label><input id="contact-subject" name="subject" value={form.subject} onChange={update} className="input-field" placeholder="How can we help?" /></div><div><label htmlFor="contact-message" className="text-sm font-semibold text-app block mb-1.5">Message</label><textarea id="contact-message" name="message" value={form.message} onChange={update} rows={5} className="input-field resize-none" placeholder="Tell us a little more..." /></div>{error && <p role="alert" className="text-sm text-rose-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}<button type="submit" className="btn-primary w-full justify-center"><Send className="w-4 h-4" />Open in email app</button></form></div></div></div>;
}

function NotFound() {
  useSeo({ title: 'Page Not Found', description: 'The page you are looking for does not exist.', path: '/404', noindex: true });
  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8" /></div>
    <h1 className="text-5xl font-extrabold text-app mb-3">404</h1>
    <h2 className="text-xl font-bold text-app mb-2">Page not found</h2>
    <p className="text-muted mb-8">The page you are looking for might have been moved or no longer exists.</p>
    <Link to="/" className="btn-primary justify-center">Back to Home <ArrowRight className="w-4 h-4" /></Link>
  </div>;
}

class BgToolErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state: { hasError: boolean } = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('Background tool error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-app mb-2">Background removal failed</h2>
            <p className="text-sm text-muted mb-4">Something went wrong during processing. Please try again.</p>
            <button className="btn-primary" onClick={() => this.setState({ hasError: false })}>Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { route } = useRouter();
  const page = route.split('?')[0];
  let content: ReactNode;
  if (page === '/') content = <Home />;
  else if (page === '/resize') content = <ResizeTool />;
  else if (page === '/signature') content = <SignatureTool />;
  else if (page === '/pdf') content = <PdfTool />;
  else if (page === '/background') content = <BgToolErrorBoundary><BackgroundTool /></BgToolErrorBoundary>;
  else if (page === '/about') content = <StaticPage type="about" />;
  else if (page === '/privacy') content = <StaticPage type="privacy" />;
  else if (page === '/terms') content = <StaticPage type="terms" />;
  else if (page === '/contact') content = <Contact />;
  else content = <NotFound />;
  return content;
}

export default App;
