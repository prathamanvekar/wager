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
import type { DisputeCase, TransactionItem } from './types/cases';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  // Modal control states
  const [selectedDisputeTxn, setSelectedDisputeTxn] = useState<TransactionItem | null>(null);
  const [isDisputeWizardOpen, setIsDisputeWizardOpen] = useState(false);
  const [isNewTxnModalOpen, setIsNewTxnModalOpen] = useState(false);

  const [activeDetailCase, setActiveDetailCase] = useState<DisputeCase | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);

  const [supportInquiryType, setSupportInquiryType] = useState<'credit_limit' | 'general' | 'card_replacement' | null>(null);
  const [isSupportInquiryOpen, setIsSupportInquiryOpen] = useState(false);

  const { session, isLoggedIn } = useSession();
  const { emitEvent } = useEvents();
  const { showToast } = useToast();

  // Guard against React Strict Mode duplicate emission of web.session.started
  const hasEmittedSessionStart = useRef(false);
  useEffect(() => {
    if (hasEmittedSessionStart.current) return;
    hasEmittedSessionStart.current = true;

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
  }, [emitEvent]);

  // When user logs in, retroactively bind any cases that were created anonymously
  const boundSessionCustomerId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !session.customer) {
      boundSessionCustomerId.current = null;
      return;
    }

    if (boundSessionCustomerId.current === session.customer.id) {
      return;
    }

    const hasAnonymousCases = cases.some((c) => c.anonymousOrigin && !c.associatedCustomerId);
    if (hasAnonymousCases) {
      boundSessionCustomerId.current = session.customer.id;
      const now = new Date().toISOString();
      const customerId = session.customer.id;
      const customerName = session.customer.fullName;
      const deviceId = session.deviceId;

      setCases((prevCases) =>
        prevCases.map((c) => {
          if (c.anonymousOrigin && !c.associatedCustomerId) {
            return {
              ...c,
              associatedCustomerId: customerId,
              timeline: [
                ...c.timeline,
                {
                  id: `tl_bind_${Date.now()}`,
                  timestamp: now,
                  title: `Identity Bound to ${customerId} (${customerName})`,
                  description: `Device token ${deviceId} claimed after successful authentication. Retraction pair emitted: (-) orphan, (+) ${customerId}.`,
                  channel: 'web' as const,
                  identityStateAtEmission: 'resolved' as const,
                  eventType: 'identity.bound',
                  actor: 'system' as const,
                },
              ],
            };
          }
          return c;
        })
      );

      // Fire toast once outside the state updater function to prevent double invocation in React StrictMode
      showToast({
        type: 'binding',
        title: 'Late Identity Binding Executed!',
        message: `Anonymous disputes from device ${deviceId} have been claimed and bound to customer ${customerId}.`,
        duration: 6000,
      });
    }
  }, [isLoggedIn, session.customer, session.deviceId, cases, showToast]);

  // Open Dispute Wizard
  const handleOpenDispute = (transaction: TransactionItem) => {
    setSelectedDisputeTxn(transaction);
    setIsDisputeWizardOpen(true);
  };

  // Case Created from Dispute Wizard
  const handleCaseCreated = (newCase: DisputeCase) => {
    // 1. Update disputed transaction's status so it shows "Dispute Pending" instead of "Unrecognized"
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === newCase.transactionId
          ? { ...t, status: 'under_review' as const, canDispute: false, disputeId: newCase.id }
          : t
      )
    );

    // 2. Add case to cases list
    setCases((prev) => [newCase, ...prev.filter((c) => c.id !== newCase.id)]);
    setActiveDetailCase(newCase);
    setIsCaseDetailOpen(true);
    setActiveTab('cases');

    if (newCase.anonymousOrigin) {
      showToast({
        type: 'warning',
        title: 'Orphan Dispute Emitted (Flagship F1)',
        message: `Dispute ${newCase.id} filed anonymously with device ${session.deviceId}. Retained in buffer until authentication.`,
      });
    } else {
      showToast({
        type: 'success',
        title: 'Dispute Case Registered',
        message: `Dispute ${newCase.id} attributed directly to customer ${session.customer?.id}.`,
      });
    }
  };

  // Record a New Transaction Manually
  const handleAddTransaction = (newTxn: TransactionItem) => {
    setTransactions((prev) => [newTxn, ...prev]);

    emitEvent(
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
    setIsCaseDetailOpen(true);
  };

  // Update Case from CaseDetailModal (e.g. after customer message)
  const handleUpdateCase = (updated: DisputeCase) => {
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveDetailCase(updated);

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
        isOpen={isCaseDetailOpen}
        onClose={() => setIsCaseDetailOpen(false)}
        caseItem={activeDetailCase}
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
