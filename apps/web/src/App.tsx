import React, { useState, useEffect, useRef } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import { EventProvider, useEvents } from './context/EventContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shell } from './layouts/Shell';
import type { ActiveTab } from './layouts/Navigation';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage, INITIAL_TRANSACTIONS } from './pages/OverviewPage';
import { CasesPage } from './pages/CasesPage';
import { SupportPage } from './pages/SupportPage';
import { InspectorPage } from './pages/InspectorPage';
import { DisputeWizard } from './components/DisputeWizard';
import { CaseDetailModal } from './components/CaseDetailModal';
import { SupportInquiryModal } from './components/SupportInquiryModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { apiClient } from './services/api';
import type { DisputeCase, TransactionItem } from './types/cases';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const { cases: sharedCases, transactions: sharedTransactions, refresh } = useEvents();
  const cases = sharedCases;
  const [detailScope, setDetailScope] = useState('');

  // Modal control states
  const [selectedDisputeTxn, setSelectedDisputeTxn] = useState<TransactionItem | null>(null);
  const [isDisputeWizardOpen, setIsDisputeWizardOpen] = useState(false);
  const [isNewTxnModalOpen, setIsNewTxnModalOpen] = useState(false);

  const [activeDetailCase, setActiveDetailCase] = useState<DisputeCase | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);

  const [supportInquiryType, setSupportInquiryType] = useState<'credit_limit' | 'general' | 'card_replacement' | null>(null);
  const [isSupportInquiryOpen, setIsSupportInquiryOpen] = useState(false);

  const { isReady, session } = useSession();
  const { emitEvent, events } = useEvents();
  const { showToast } = useToast();

  // Guard against React Strict Mode duplicate emission of web.session.started
  const hasEmittedSessionStart = useRef(new Set<string>());
  useEffect(() => {
    if (!isReady || hasEmittedSessionStart.current.has(session.sessionId)) return;
    hasEmittedSessionStart.current.add(session.sessionId);

    emitEvent(
      'web.session.started',
      {
        referrer: 'direct',
        user_agent_category: 'desktop_chrome',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      {
        threadHint: 'session_initiation',
      }
    );
  }, [emitEvent, isReady, session.sessionId]);

  const scope = `${session.sessionId}:${session.customer?.id || 'anonymous'}`;
  const pendingTransactions = events
    .filter(e => e.status === 'queued_offline' && e.envelope.event_type === 'payment.authorized' && e.envelope.identifiers.session_id === session.sessionId)
    .map(e => {
      const p = e.envelope.payload;
      return {id: String(p.transaction_id), date: String(p.date), merchant: String(p.merchant), category: String(p.category), amount: Number(p.amount), currency: String(p.currency), location: String(p.location), canDispute: p.status !== 'cleared', status: p.status, channel: p.channel, cycle: p.cycle} as TransactionItem;
    });
  const baseTransactions = sharedTransactions.length ? sharedTransactions : INITIAL_TRANSACTIONS;
  const transactions = [...pendingTransactions, ...baseTransactions.filter(t => !pendingTransactions.some(p => p.id === t.id))].map(t => {
    const c = cases.find(item => item.transactionId === t.id);
    return c ? {...t, status: 'under_review' as const, canDispute: false, disputeId: c.id} : t;
  });
  const detailCase = detailScope === scope ? cases.find(c => c.id === activeDetailCase?.id) || activeDetailCase : null;

  // Open Dispute Wizard
  const handleOpenDispute = (transaction: TransactionItem) => {
    setSelectedDisputeTxn(transaction);
    setIsDisputeWizardOpen(true);
  };

  // Case Created from Dispute Wizard
  const handleCaseCreated = (newCase: DisputeCase) => {
    void refresh();
    setActiveDetailCase(newCase);
    setDetailScope(scope);
    setIsCaseDetailOpen(true);
    setActiveTab('cases');

    showToast({type: 'success', title: 'Inquiry saved', message: apiClient.getOfflineQueue().length ? 'Saved on this device. It will sync when you reconnect.' : 'Your conversation is available across connected channels.'});
  };

  // Record a New Transaction Manually
  const handleAddTransaction = async (newTxn: TransactionItem) => {
    await emitEvent(
      'payment.authorized',
      {
        transaction_id: newTxn.id,
        merchant: newTxn.merchant,
        amount: newTxn.amount,
        currency: newTxn.currency,
        category: newTxn.category,
        channel: newTxn.channel || 'web',
        location: newTxn.location,
        status: newTxn.status,
        date: newTxn.date,
        cycle: newTxn.cycle,
      },
      {
        threadHint: 'transaction_stream',
      }
    );

    showToast({
      type: 'success',
      title: 'Transaction Recorded',
      message: `${newTxn.merchant} ($${newTxn.amount.toFixed(2)}) recorded and available in your feed.`,
    });
  };

  // Open Case Details
  const handleSelectCase = (caseItem: DisputeCase) => {
    setActiveDetailCase(caseItem);
    setDetailScope(scope);
    setIsCaseDetailOpen(true);
  };

  // Update Case from CaseDetailModal (e.g. after customer message)
  const handleUpdateCase = (updated: DisputeCase) => {
    void refresh();
    setActiveDetailCase(updated);
    setDetailScope(scope);

    showToast({
      type: 'info',
      title: 'Message Appended to Journey',
      message: `Follow-up event dispatched to case ${updated.id}.`,
    });
  };

  // Open Support Inquiry Modal
  const handleStartInquiry = (intentType: 'credit_limit' | 'general' | 'card_replacement') => {
    setSupportInquiryType(intentType);
    setIsSupportInquiryOpen(true);
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage
          onLaunchDashboard={() => setCurrentView('portal')}
        />
      ) : (
        <Shell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNavigateToLanding={() => setCurrentView('landing')}
        >
          {activeTab === 'overview' && (
            <OverviewPage
              transactions={transactions}
              cases={cases}
              onOpenDispute={handleOpenDispute}
              onNavigateToCases={() => setActiveTab('cases')}
              onOpenNewTransaction={() => setIsNewTxnModalOpen(true)}
              onSelectCase={handleSelectCase}
            />
          )}
          {activeTab === 'cases' && (
            <CasesPage
              cases={cases}
              onSelectCase={handleSelectCase}
              onNewDispute={() => {
                const disputableTxn = transactions.find((t) => t.canDispute) || transactions[0];
                handleOpenDispute(disputableTxn);
              }}
            />
          )}
          {activeTab === 'support' && (
            <SupportPage onStartInquiry={handleStartInquiry} />
          )}
          {activeTab === 'inspector' && <InspectorPage />}
        </Shell>
      )}

      {/* 1. Dispute Submission Wizard */}
      <DisputeWizard
        isOpen={isDisputeWizardOpen}
        onClose={() => setIsDisputeWizardOpen(false)}
        transaction={selectedDisputeTxn}
        allTransactions={transactions}
        onCaseCreated={handleCaseCreated}
      />

      {/* 2. Comprehensive Case Detail & Multi-Channel Timeline Modal */}
      <CaseDetailModal
        isOpen={isCaseDetailOpen && detailScope === scope}
        onClose={() => setIsCaseDetailOpen(false)}
        caseItem={detailCase}
        onUpdateCase={handleUpdateCase}
      />

      {/* 3. Multi-Intent Support Inquiry Modal */}
      <SupportInquiryModal
        isOpen={isSupportInquiryOpen}
        onClose={() => setIsSupportInquiryOpen(false)}
        intentType={supportInquiryType}
        onCaseCreated={handleCaseCreated}
      />

      {/* 4. Manual Transaction Recording Modal */}
      <NewTransactionModal
        isOpen={isNewTxnModalOpen}
        onClose={() => setIsNewTxnModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />
    </>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <EventProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </EventProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default App;
