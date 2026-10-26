import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Terminal,
  Database,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  FolderLock,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { FIREBASE_PROJECT_ID } from '@/services/firebase/firebase';

export const AdminSetupPage: React.FC = () => {
  const { user, claims, refreshClaims } = useAuth();
  const { success } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    success('Copied to clipboard');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const scriptCommand = `node scripts/set-admin-claim.js ${user?.uid || 'TARGET_USER_UID'}`;

  const firestoreRulesDeploy = `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project ${FIREBASE_PROJECT_ID}`;
  const rtdbRulesDeploy = `npx firebase-tools deploy --only database --project ${FIREBASE_PROJECT_ID}`;
  const storageRulesDeploy = `npx firebase-tools deploy --only storage --project ${FIREBASE_PROJECT_ID}`;
  const functionsDeploy = `npx firebase-tools deploy --only functions --project ${FIREBASE_PROJECT_ID}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Admin Provisioning & Firebase Security Guide
            </h2>
            <span className="badge badge-success">Production Hardening</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Architecture reference and trusted administrative processes for project <strong>{FIREBASE_PROJECT_ID}</strong>.
          </p>
        </div>

        <button
          onClick={() => refreshClaims()}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Refresh Active Token Claims</span>
        </button>
      </div>

      {/* Current Admin Authorization State */}
      <div className="glass-card p-6 border-emerald-200 bg-emerald-50/30 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <span>Current Session Authorization</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Logged In Email</span>
            <strong className="text-slate-900 truncate block">{user?.email || 'Not authenticated'}</strong>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Firebase UID</span>
            <strong className="text-slate-900 font-mono text-[11px] truncate block">{user?.uid || 'N/A'}</strong>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Custom Claim Status</span>
            <strong className={claims?.admin ? 'text-emerald-700' : 'text-amber-700'}>
              {claims?.admin ? '✓ admin=true (Custom Claims)' : '○ Standard Auth / Firestore Fallback'}
            </strong>
          </div>
        </div>
      </div>

      {/* Step 1: Provisioning First Admin */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Provision Administrator Custom Claims
            </h3>
          </div>
          <span className="badge badge-info text-[10px]">Firebase Admin SDK</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          In production, administrator privileges must never be granted via client-side code. Use the included trusted administrative provisioning script with a Firebase Service Account key:
        </p>

        <div className="relative">
          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
            {scriptCommand}
          </pre>
          <button
            onClick={() => copyToClipboard(scriptCommand, 'script')}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Copy command"
          >
            {copiedSection === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5 text-slate-700">
          <p className="font-semibold text-slate-900">Script Location:</p>
          <p className="font-mono text-[11px] text-emerald-800 bg-white p-2 rounded border border-slate-200">
            scripts/set-admin-claim.js
          </p>
          <p className="text-[11px] text-slate-500">
            Download your Service Account JSON from <strong>Firebase Console → Project Settings → Service Accounts</strong>, save as <code className="font-mono text-slate-700">serviceAccountKey.json</code> in the project root, and execute the command.
          </p>
        </div>
      </div>

      {/* Step 2: Security Rules Deployments */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Deploy Production Security Rules & Cloud Functions
            </h3>
          </div>
          <span className="badge badge-success text-[10px]">Ready to Deploy</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The following security definitions have been authored to protect customers, drivers, fares, and financial records from unauthorized client mutations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firestore */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <strong className="text-xs text-slate-900">Firestore Rules & Indexes</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Strict RBAC ensuring riders only read their own trips and admins control approvals.
            </p>
            <pre className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg overflow-x-auto">
              {firestoreRulesDeploy}
            </pre>
          </div>

          {/* Realtime Database */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <strong className="text-xs text-slate-900">Realtime Database Rules</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Allows verified drivers to stream coordinates while restricting admin fleet views.
            </p>
            <pre className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg overflow-x-auto">
              {rtdbRulesDeploy}
            </pre>
          </div>

          {/* Storage Rules */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-amber-700" />
              <strong className="text-xs text-slate-900">Cloud Storage Rules</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Restricts uploads to valid image/PDF formats up to 10MB under driver UIDs.
            </p>
            <pre className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg overflow-x-auto">
              {storageRulesDeploy}
            </pre>
          </div>

          {/* Cloud Functions */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-700" />
              <strong className="text-xs text-slate-900">Firebase Cloud Functions</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Backend calculation engine for fares, commission deductions, and settlements.
            </p>
            <pre className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg overflow-x-auto">
              {functionsDeploy}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
