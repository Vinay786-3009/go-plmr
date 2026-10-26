import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supportService } from '../../services/supportService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Search,
  Shield,
  Receipt,
  Globe,
  User,
  Users,
  Wallet,
  Tag,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';

export const SupportPage = () => {
  const [searchParams] = useSearchParams();
  const initialRideId = searchParams.get('rideId') || '';

  const { user, profile } = useAuth();
  const { success, error, warning } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState(null);

  // Form states
  const [showTicketForm, setShowTicketForm] = useState(Boolean(initialRideId));
  const [category, setCategory] = useState('fare');
  const [subject, setSubject] = useState(initialRideId ? `Trip Issue: ${initialRideId.slice(0, 8)}` : '');
  const [description, setDescription] = useState('');
  const [rideId, setRideId] = useState(initialRideId);
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const faqCategories = [
    { id: 'safety', label: 'Safety & Security', icon: Shield, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'fare', label: 'Ride & Billing', icon: Receipt, color: 'bg-rose-50 text-rose-600' },
    { id: 'services', label: 'Services', icon: Globe, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'account', label: 'Account & App', icon: User, color: 'bg-sky-50 text-sky-600' },
    { id: 'referrals', label: 'Referrals', icon: Users, color: 'bg-amber-50 text-amber-600' },
    { id: 'payment', label: 'Payment & Wallets', icon: Wallet, color: 'bg-purple-50 text-purple-600' },
    { id: 'offers', label: 'Offers & Passes', icon: Tag, color: 'bg-teal-50 text-teal-600' },
  ];

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const data = await supportService.getCustomerTickets(user.uid);
      setTickets(data);
    } catch (err) {
      console.warn('Error loading support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      warning('Please provide both subject and description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await supportService.submitTicket({
        raisedByUid: user.uid,
        raisedByName: profile?.fullName || user.displayName || 'Customer',
        raisedByPhone: profile?.phoneNumber || '',
        rideId: rideId.trim() || null,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority: category === 'safety' ? 'high' : 'medium',
      });

      success(`Ticket #${res.ticketNumber} submitted! Admin team has been notified.`);
      setSubject('');
      setDescription('');
      setRideId('');
      setShowTicketForm(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to submit support ticket:', err);
      error(err.message || 'Could not submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolved', className: 'badge-success' };
      case 'under_review':
        return { label: 'Under Review', className: 'badge-warning' };
      case 'rejected':
        return { label: 'Closed', className: 'badge-danger' };
      default:
        return { label: 'Open', className: 'badge-info' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Yellow Top Banner (Image 3 Screen 6 Style) */}
      <div className="yellow-header">
        <Link to="/" className="p-1 -ml-1 text-slate-900 hover:bg-black/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </Link>
        <span className="font-black text-base text-slate-900">Help & Support</span>
        <div className="w-6" />
      </div>

      <div className="p-5">
        {/* Search Bar (From Image 3 Screen 6) */}
        <div className="relative flex items-center mb-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issue..."
            className="input-field pl-10 bg-slate-50 border border-slate-200"
          />
        </div>

        {/* Having an issue Card (From Image 3 Screen 6) */}
        <div className="p-4 rounded-2xl border border-slate-200/90 shadow-sm bg-white mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Having an issue?</span>
              <span className="text-[11px] text-slate-500">Contact GO PLMR support team</span>
            </div>
          </div>
          <button
            onClick={() => setShowTicketForm(!showTicketForm)}
            className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all"
          >
            {showTicketForm ? 'Close Form' : 'Get Help'}
          </button>
        </div>

        {/* Ticket Submission Form */}
        {showTicketForm && (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
              Raise a Support Ticket
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field bg-white"
                >
                  <option value="fare">Fare & Billing</option>
                  <option value="driver_behavior">Driver Conduct</option>
                  <option value="vehicle_condition">Vehicle Condition</option>
                  <option value="safety">Safety Concern</option>
                  <option value="lost_item">Lost Item</option>
                  <option value="cancellation">Cancellation & Refund</option>
                  <option value="other">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of your issue"
                  className="input-field bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Details</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your experience so our admin team can assist you..."
                  className="input-field bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-yellow w-full py-3.5 text-xs font-black uppercase tracking-wider shadow-yellow-glow mt-1"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'SUBMIT TICKET'
                )}
              </button>
            </form>
          </div>
        )}

        {/* FAQs Grid (Matching Image 3 Screen 6) */}
        <div>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-3">
            FAQs
          </span>

          <div className="grid grid-cols-3 gap-3">
            {faqCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedFaqCategory(item.id);
                  setCategory(item.id === 'safety' ? 'safety' : item.id === 'fare' ? 'fare' : 'other');
                  setShowTicketForm(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-slate-50 transition-all text-center aspect-square shadow-2xs"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Previous Support Tickets */}
        <div className="mt-8">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-3">
            Your Tickets
          </span>

          {loadingTickets ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-400">
              No tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((t) => {
                const status = getStatusBadge(t.status);
                return (
                  <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{t.ticketNumber}</span>
                      <span className={`badge ${status.className}`}>{status.label}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{t.subject}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                    {t.resolutionNotes && (
                      <div className="p-2 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-medium">
                        <b>Resolution:</b> {t.resolutionNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
