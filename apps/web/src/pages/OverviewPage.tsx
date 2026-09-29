import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import type { TransactionItem, DisputeCase } from '../types/cases';

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'txn_88213',
    date: 'Today 09:42 AM',
    merchant: 'CloudScale SaaS Hosting Ltd',
    category: 'Software & Technology',
    amount: 142.5,
    currency: 'USD',
    location: 'Online Transaction · Stripe Billing',
    canDispute: true,
    status: 'unrecognized',
    channel: 'web',
    cycle: 'current',
  },
  {
    id: 'txn_77910',
    date: 'Yesterday 07:15 PM',
    merchant: 'Metropolis Bistro & Lounge',
    category: 'Dining & Hospitality',
    amount: 68.2,
    currency: 'USD',
    location: 'Downtown Branch POS Terminal 4',
    canDispute: true,
    status: 'eligible',
    channel: 'pos',
    cycle: 'current',
  },
  {
    id: 'txn_65219',
    date: 'Sat 11:30 AM',
    merchant: 'Apex Premier Direct Deposit',
    category: 'Payroll & Income',
    amount: 3250.0,
    currency: 'USD',
    location: 'ACH Electronic Federal Reserve Transfer',
    canDispute: true,
    status: 'cleared',
    channel: 'web',
    cycle: 'current',
  },
  {
    id: 'txn_54192',
    date: 'Fri 03:22 PM',
    merchant: 'Apex Mobile Express Transfer',
    category: 'Internal Transfer',
    amount: 250.0,
    currency: 'USD',
    location: 'Mobile App Channel (iOS Client)',
    canDispute: true,
    status: 'cleared',
    channel: 'mobile',
    cycle: 'previous',
  },
];

interface OverviewPageProps {
  transactions: TransactionItem[];
  cases: DisputeCase[];
  onOpenDispute: (transaction: TransactionItem) => void;
  onNavigateToCases: () => void;
  onOpenNewTransaction: () => void;
  onSelectCase?: (caseItem: DisputeCase) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  transactions,
  cases,
  onOpenDispute,
  onNavigateToCases,
  onOpenNewTransaction,
  onSelectCase,
}) => {
  const { session, isLoggedIn, openAuthModal } = useSession();
  const { events, orphanCount } = useEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'eligible' | 'disputed' | 'cleared'>('all');
  const [selectedCycle, setSelectedCycle] = useState<'all' | 'current' | 'previous'>('current');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Derive unique categories from active transactions
  const availableCategories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set);
  }, [transactions]);

  // Map transaction to case if disputed
  const getDisputeCaseForTxn = (txnId: string): DisputeCase | undefined => {
    return cases.find((c) => c.transactionId === txnId);
  };

  // Filtered transactions (memoized)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMerchant = txn.merchant.toLowerCase().includes(q);
        const matchesId = txn.id.toLowerCase().includes(q);
        const matchesCategory = txn.category.toLowerCase().includes(q);
        const matchesLocation = txn.location.toLowerCase().includes(q);
        const matchesAmount = txn.amount.toString().includes(q);
        if (!matchesMerchant && !matchesId && !matchesCategory && !matchesLocation && !matchesAmount) {
          return false;
        }
      }

      // 2. Billing cycle filter
      if (selectedCycle !== 'all' && txn.cycle && txn.cycle !== selectedCycle) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && txn.category !== selectedCategory) {
        return false;
      }

      // 4. Status / Tab filter
      const isDisputed = txn.status === 'disputed' || txn.status === 'under_review' || !!getDisputeCaseForTxn(txn.id);
      if (filterTab === 'eligible') {
        return !isDisputed && (txn.status === 'eligible' || txn.status === 'unrecognized' || txn.canDispute);
      }
      if (filterTab === 'disputed') {
        return isDisputed;
      }
      if (filterTab === 'cleared') {
        return !isDisputed && txn.status === 'cleared';
      }

      return true;
    });
  }, [transactions, searchQuery, selectedCycle, selectedCategory, filterTab, cases]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Page Header with Title & Action */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Portal Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            View account balances, recent transaction events, and cross-channel journeys in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={onOpenNewTransaction}
            leftIcon={<PlusCircle size={15} />}
          >
            Record Transaction
          </Button>

          {!isLoggedIn ? (
            <Button
              variant="primary"
              onClick={openAuthModal}
              leftIcon={<Clock size={15} />}
            >
              Sign In (C1041)
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onNavigateToCases}
              leftIcon={<FileText size={15} />}
            >
              View Disputed Cases ({cases.length})
            </Button>
          )}
        </div>
      </div>

      {/* 2. Real-Time Cross-Channel Journey Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '820px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: '1px solid #bae6fd',
                  }}
                >
                  Cross-Channel Journey Graph
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {isLoggedIn
                    ? `Active Persona: ${session.customer?.id || 'C1041'} (${session.customer?.fullName || 'Alex Mercer'})`
                    : 'Anonymous Session Active'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>
                {isLoggedIn
                  ? `Authenticated Persona Active: ${session.customer?.fullName} (${session.customer?.id})`
                  : 'Real-Time Touchpoint Capture & Late Identity Binding'}
              </h2>

              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
                {isLoggedIn ? (
                  <>
                    You are now authenticated. Any transaction disputes or support inquiries initiated prior to sign-in have been automatically claimed and bound to customer <strong>{session.customer?.id}</strong>. The bitemporal store emits a negative/positive retraction pair to maintain continuous audit truth.
                  </>
                ) : (
                  <>
                    You are currently <strong>browsing anonymously</strong>. When you dispute any charge below, Wager captures the action with <code>identity_state = 'orphan'</code> under device token <code>{session.deviceId.slice(0, 16)}...</code>. When you sign in, the system retroactively stitches these events into your primary profile!
                  </>
                )}
              </p>
            </div>

            <div>
              {!isLoggedIn ? (
                <Button
                  variant="outline"
                  onClick={openAuthModal}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Sign In as C1041
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onNavigateToCases}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Inspect Journey
                </Button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar (Accurate real-time channel status) */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Step 1: Web Portal */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isLoggedIn ? '#10b981' : '#f59e0b',
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLoggedIn ? '#047857' : '#b45309' }}>
                  1. Web (Portal)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', marginTop: '0.2rem' }}>
                {isLoggedIn ? 'Authenticated Session' : 'Anonymous Dispute'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {isLoggedIn ? `Customer ${session.customer?.id || 'C1041'} Bound` : 'Buffered as ORPHAN'}
              </div>
            </div>

            {/* Step 2: Mobile App (Standby - Not green as requested) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
                  2. Mobile (App)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', marginTop: '0.2rem' }}>
                Standby Channel
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Awaiting mobile client
              </div>
            </div>

            {/* Step 3: Voice IVR */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  3. Call (Voice IVR)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', marginTop: '0.2rem' }}>
                Telephony Stream
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Standby for call events
              </div>
            </div>

            {/* Step 4: Bitemporal Store */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857' }}>
                  4. Bitemporal Store
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', marginTop: '0.2rem' }}>
                Real-Time Ingestion
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Zero-overwrites audit trail
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Account Balances Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
            Apex Premier Checking
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            $18,452.90
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <span>Account: ····4902</span>
            <span style={{ color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={13} /> Active
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
            Apex High-Yield Treasury
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            $45,120.15
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <span>Account: ····9011</span>
            <span style={{ color: '#2563eb', fontWeight: 500 }}>4.85% APY</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
            Dispute & Event State
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {cases.length > 0 ? `${cases.length} Disputed` : orphanCount > 0 ? `${orphanCount} Pending` : 'All Clear'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <span>{events.length} Envelopes Logged</span>
            <span style={{ color: orphanCount > 0 ? '#d97706' : '#059669', fontWeight: 500 }}>
              {orphanCount > 0 ? `${orphanCount} Orphan buffered` : 'All Resolved'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Transactions Workspace */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Table Top Toolbar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Sub-tabs strip */}
          <Tabs
            tabs={[
              { id: 'all', label: 'All transactions' },
              { id: 'eligible', label: 'Eligible for Dispute' },
              { id: 'disputed', label: `Disputed (${cases.length})` },
              { id: 'cleared', label: 'Settled & Cleared' },
            ]}
            activeTab={filterTab}
            onChange={(id) => setFilterTab(id as any)}
            variant="underline"
          />

          {/* Search, Cycle & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', position: 'relative' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                aria-label="Search transactions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4375rem 2rem 0.4375rem 2.25rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Cycle Selector Popover */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setIsCycleDropdownOpen(!isCycleDropdownOpen);
                  setIsFilterDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.4375rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedCycle !== 'all' ? '#f0fdf4' : '#ffffff',
                  borderColor: selectedCycle !== 'all' ? '#86efac' : '#cbd5e1',
                  fontSize: '0.8125rem',
                  color: selectedCycle !== 'all' ? '#166534' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Calendar size={14} color={selectedCycle !== 'all' ? '#166534' : '#64748b'} />
                <span>
                  {selectedCycle === 'current'
                    ? 'Current Cycle'
                    : selectedCycle === 'previous'
                    ? 'Previous Cycle'
                    : 'All Cycles'}
                </span>
                <ChevronDown size={12} />
              </button>

              {isCycleDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.375rem)',
                    right: 0,
                    width: '200px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
                    zIndex: 40,
                    padding: '0.375rem',
                  }}
                >
                  {[
                    { id: 'current', label: 'Current Cycle (Oct 2026)' },
                    { id: 'previous', label: 'Previous Cycle (Sep 2026)' },
                    { id: 'all', label: 'All Billing Cycles' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCycle(c.id as any);
                        setIsCycleDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.625rem',
                        fontSize: '0.8125rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: selectedCycle === c.id ? '#eff6ff' : 'transparent',
                        color: selectedCycle === c.id ? '#1d4ed8' : '#334155',
                        fontWeight: selectedCycle === c.id ? 600 : 500,
                        cursor: 'pointer',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters Popover */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsCycleDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.4375rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedCategory !== 'all' ? '#eff6ff' : '#ffffff',
                  borderColor: selectedCategory !== 'all' ? '#bfdbfe' : '#cbd5e1',
                  fontSize: '0.8125rem',
                  color: selectedCategory !== 'all' ? '#1d4ed8' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Filter size={14} color={selectedCategory !== 'all' ? '#1d4ed8' : '#64748b'} />
                <span>{selectedCategory !== 'all' ? selectedCategory : 'Filters'}</span>
                <ChevronDown size={12} />
              </button>

              {isFilterDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.375rem)',
                    right: 0,
                    width: '240px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
                    zIndex: 40,
                    padding: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                    Filter by Category
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.375rem 0.5rem',
                      fontSize: '0.8125rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: selectedCategory === 'all' ? '#eff6ff' : 'transparent',
                      color: selectedCategory === 'all' ? '#1d4ed8' : '#334155',
                      fontWeight: selectedCategory === 'all' ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    All Categories
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsFilterDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.375rem 0.5rem',
                        fontSize: '0.8125rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: selectedCategory === cat ? '#eff6ff' : 'transparent',
                        color: selectedCategory === cat ? '#1d4ed8' : '#334155',
                        fontWeight: selectedCategory === cat ? 600 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {cat}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedCycle('all');
                        setSearchQuery('');
                        setFilterTab('all');
                        setIsFilterDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section title & count header */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Recent activity</span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
              ({filteredTransactions.length} items)
            </span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#475569',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: isLoggedIn ? '#10b981' : '#f59e0b',
                flexShrink: 0,
              }}
            />
            <span>{isLoggedIn ? `Attributed (${session.customer?.id || 'C1041'})` : 'Anonymous Session'}</span>
          </span>
        </div>

        {/* High-Density SaaS Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                }}
              >
                <th scope="col" style={{ padding: '0.75rem 1.5rem', width: '30px' }}>
                  <input
                    type="checkbox"
                    aria-label="Select all transactions"
                    style={{ borderRadius: '3px', cursor: 'pointer' }}
                    readOnly
                  />
                </th>
                <th scope="col" style={{ padding: '0.75rem 1rem' }}>Transaction ID</th>
                <th scope="col" style={{ padding: '0.75rem 1rem' }}>Merchant & Channel</th>
                <th scope="col" style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th scope="col" style={{ padding: '0.75rem 1rem' }}>Valid Date ↓</th>
                <th scope="col" style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                <th scope="col" style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                    <Layers size={28} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>No transactions found</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      Try adjusting your search query or billing cycle filter.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const disputeCase = getDisputeCaseForTxn(txn.id);
                  const isDisputed = txn.status === 'disputed' || txn.status === 'under_review' || !!disputeCase;
                  const isFlagshipTxn = txn.id === 'txn_88213';

                  return (
                    <tr
                      key={txn.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: isDisputed ? '#fefce8' : isFlagshipTxn ? '#fafafa' : '#ffffff',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <input
                          type="checkbox"
                          aria-label={`Select transaction ${txn.id}`}
                          style={{ borderRadius: '3px', cursor: 'pointer' }}
                          readOnly
                        />
                      </td>

                      {/* Transaction ID */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {txn.id}
                        </div>
                        {isFlagshipTxn && (
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#d97706', marginTop: '0.15rem' }}>
                            Flagship Target
                          </div>
                        )}
                      </td>

                      {/* Merchant & Location */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{txn.merchant}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                          {txn.location}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8125rem' }}>
                        {txn.category}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem', color: '#334155', fontSize: '0.8125rem' }}>
                        {txn.date}
                      </td>

                      {/* Status Indicator */}
                      <td style={{ padding: '1rem' }}>
                        {isDisputed ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#f59e0b',
                                flexShrink: 0,
                              }}
                            />
                            <span>Dispute Pending</span>
                          </span>
                        ) : txn.status === 'unrecognized' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#b45309',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#f59e0b',
                                flexShrink: 0,
                              }}
                            />
                            <span>Unrecognized</span>
                          </span>
                        ) : txn.status === 'eligible' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#047857',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                flexShrink: 0,
                              }}
                            />
                            <span>Eligible</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#047857',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                flexShrink: 0,
                              }}
                            />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        ${txn.amount.toFixed(2)}
                      </td>

                      {/* Action Button */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        {isDisputed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (disputeCase && onSelectCase) {
                                onSelectCase(disputeCase);
                              } else {
                                onNavigateToCases();
                              }
                            }}
                          >
                            View Dispute
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={isFlagshipTxn ? 'amber' : 'outline'}
                            leftIcon={<ShieldAlert size={13} />}
                            onClick={() => onOpenDispute(txn)}
                          >
                            Dispute Charge
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: '#64748b',
          }}
        >
          <div>
            Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" variant="outline" disabled aria-label="Previous page" leftIcon={<ChevronLeft size={14} />}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled aria-label="Next page" rightIcon={<ChevronRight size={14} />}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
