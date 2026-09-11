import { Camera, ShieldCheck, Heart, ArrowUpRight, Mail } from 'lucide-react';
import { Link } from '@/lib/router';
import AdPlaceholder from './AdPlaceholder';

export default function Footer() {
  return (
    <footer className="border-t border-app/50 mt-20">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <AdPlaceholder variant="banner" className="mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"><Camera className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-extrabold text-app tracking-tight">Photo<span className="text-primary">Tools</span></span>
            </Link>
            <p className="text-muted max-w-sm leading-relaxed mb-5">Beautifully simple photo tools that respect your privacy. Everything happens locally in your browser.</p>
            <div className="flex items-center gap-2 text-sm text-accent font-medium"><ShieldCheck className="w-4 h-4" /> 100% private. Always free.</div>
          </div>
          <div>
            <h3 className="font-semibold text-app mb-4">Tools</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link to="/resize" className="hover:text-primary transition-colors">Resize & Compress</Link></li>
              <li><Link to="/signature" className="hover:text-primary transition-colors">Signature Resizer</Link></li>
              <li><Link to="/pdf" className="hover:text-primary transition-colors">Images to PDF</Link></li>
              <li><Link to="/background" className="hover:text-primary transition-colors">Remove Background</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-app mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-app/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted">
          <p>© {new Date().getFullYear()} PhotoTools. Made with <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-current" /> for the web.</p>
          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> phototool07@gmail.com <ArrowUpRight className="w-3 h-3" /></p>
        </div>
      </div>
    </footer>
  );
}
