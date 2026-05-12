import React, { useState } from 'react';
import { X, Share2, Copy, Hash, Camera, Music, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShareModal({ isOpen, onClose, title, description, url, user }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareToTwitter = () => {
    const text = `Check out my ${title}: ${description}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = `Check out my ${title}: ${description} ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Check out my ${title}`;
    const body = `Hi,\n\nI wanted to share my ${title} with you:\n\n${description}\n\n${url}\n\nBest regards,\n${user?.displayName}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" /> Share {title}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <p className="text-slate-600 text-sm mb-6">{description}</p>

          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
            >
              <Copy className={`w-5 h-5 ${copied ? 'text-green-600' : 'text-slate-600'}`} />
              <div>
                <p className="font-medium text-slate-800">{copied ? 'Copied!' : 'Copy Link'}</p>
                <p className="text-xs text-slate-500">Copy to clipboard</p>
              </div>
            </button>

            <button
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
            >
              <Hash className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-slate-800">Share on X (Twitter)</p>
                <p className="text-xs text-slate-500">Post to your timeline</p>
              </div>
            </button>

            <button
              onClick={shareToWhatsApp}
              className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-slate-800">Share on WhatsApp</p>
                <p className="text-xs text-slate-500">Send to contacts</p>
              </div>
            </button>

            <button
              onClick={shareViaEmail}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
            >
              <Mail className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-800">Share via Email</p>
                <p className="text-xs text-slate-500">Send email to contacts</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}