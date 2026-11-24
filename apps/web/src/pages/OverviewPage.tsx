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

import demoTransactions from '../../../../packages/contracts/fixtures/transactions.json';
export const INITIAL_TRANSACTIONS = demoTransactions as TransactionItem[];

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
  const disputeCount = cases.filter(c => c.threadHint === 'billing_dispute').length;
  const mobileEventCount = events.filter(e => e.envelope.source.channel === 'mobile').length;
  const callEventCount = events.filter(e => e.envelope.source.channel === 'call').length;

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
    <div className="portal-page overview-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Page Header with Title & Action */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Portal Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
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
              View Inquiries ({cases.length})
            </Button>
          )}
        </div>
      </div>

      {/* 3. Account Balances Overview */}
      <div className="account-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Apex Premier Checking
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            $18,452.90
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--bg-surface-hover)' }}>
            <span>Account: ····4902</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={13} /> Active
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Apex High-Yield Treasury
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            $45,120.15
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--bg-surface-hover)' }}>
            <span>Account: ····9011</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>4.85% APY</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inquiries & Shared Events
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {cases.length > 0 ? `${cases.length} Active` : orphanCount > 0 ? `${orphanCount} Pending` : 'All Clear'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--bg-surface-hover)' }}>
            <span>{events.length} Envelopes Logged</span>
            <span style={{ color: orphanCount > 0 ? 'var(--state-orphan)' : 'var(--color-primary)', fontWeight: 500 }}>
              {orphanCount > 0 ? `${orphanCount} Orphan buffered` : 'All Resolved'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Cross-Channel Journey Card */}
      <div className="journey-status"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'none',
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
                    color: 'var(--channel-web)',
                    backgroundColor: 'var(--channel-web-bg)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: '1px solid var(--channel-web-border)',
                  }}
                >
                  Cross-Channel Journey Graph
                </span>
                <span style={{ color: 'var(--border-medium)' }}>•</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {isLoggedIn
                    ? `Active Persona: ${session.customer?.id || 'C1041'} (${session.customer?.fullName || 'Alex Mercer'})`
                    : 'Anonymous Session Active'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>
                {isLoggedIn
                  ? `Authenticated Persona Active: ${session.customer?.fullName} (${session.customer?.id})`
                  : 'Real-Time Touchpoint Capture & Late Identity Binding'}
              </h2>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
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
              borderTop: '1px solid var(--bg-surface-hover)',
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
                    backgroundColor: isLoggedIn ? 'var(--state-resolved-dot)' : 'var(--state-orphan-dot)',
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLoggedIn ? 'var(--color-primary-hover)' : 'var(--state-orphan)' }}>
                  1. Web (Portal)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {isLoggedIn ? 'Authenticated Session' : 'Anonymous Dispute'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                    backgroundColor: 'var(--state-orphan-dot)',
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--state-orphan)' }}>
                  2. Mobile (App)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {mobileEventCount ? `${mobileEventCount} mobile touchpoints` : 'Standby Channel'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {mobileEventCount ? 'Connected through the shared API' : 'Awaiting mobile client'}
              </div>
            </div>

            {/* Step 3: Voice IVR */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--text-subtle)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  3. Call (Voice IVR)
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {callEventCount ? `${callEventCount} voice touchpoints` : 'Telephony Stream'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {callEventCount ? 'Events available in shared history' : 'Standby for call events'}
              </div>
            </div>

            {/* Step 4: Bitemporal Store */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--state-resolved-dot)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-hover)' }}>
                  4. Bitemporal Store
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                Real-Time Ingestion
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Zero-overwrites audit trail
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Transactions Workspace */}
      <div className="transactions-workspace"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Table Top Toolbar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
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
              { id: 'disputed', label: `Disputed (${disputeCount})` },
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
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
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
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
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
                    color: 'var(--text-subtle)',
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
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedCycle !== 'all' ? 'var(--state-resolved-bg)' : 'var(--bg-surface)',
                  borderColor: selectedCycle !== 'all' ? 'var(--state-resolved-border)' : 'var(--border-medium)',
                  fontSize: '0.8125rem',
                  color: selectedCycle !== 'all' ? 'var(--state-resolved)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Calendar size={14} color={selectedCycle !== 'all' ? 'var(--state-resolved)' : 'var(--text-muted)'} />
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
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
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
                        backgroundColor: selectedCycle === c.id ? 'var(--color-primary-light)' : 'transparent',
                        color: selectedCycle === c.id ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
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
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedCategory !== 'all' ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                  borderColor: selectedCategory !== 'all' ? 'var(--color-primary-border)' : 'var(--border-medium)',
                  fontSize: '0.8125rem',
                  color: selectedCategory !== 'all' ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Filter size={14} color={selectedCategory !== 'all' ? 'var(--color-primary-hover)' : 'var(--text-muted)'} />
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
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
                    zIndex: 40,
                    padding: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
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
                      backgroundColor: selectedCategory === 'all' ? 'var(--color-primary-light)' : 'transparent',
                      color: selectedCategory === 'all' ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
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
                        backgroundColor: selectedCategory === cat ? 'var(--color-primary-light)' : 'transparent',
                        color: selectedCategory === cat ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                        fontWeight: selectedCategory === cat ? 600 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {cat}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
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
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
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
            backgroundColor: 'var(--bg-app)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Recent activity</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
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
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: isLoggedIn ? 'var(--state-resolved-dot)' : 'var(--state-orphan-dot)',
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
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-surface)',
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                    <Layers size={28} style={{ margin: '0 auto 0.5rem auto', color: 'var(--border-medium)' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No transactions found</div>
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
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isDisputed ? 'var(--state-orphan-bg)' : isFlagshipTxn ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
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
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {txn.id}
                        </div>
                        {isFlagshipTxn && (
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--state-orphan)', marginTop: '0.15rem' }}>
                            Flagship Target
                          </div>
                        )}
                      </td>

                      {/* Merchant & Location */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{txn.merchant}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {txn.location}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {txn.category}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
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
                              color: 'var(--state-orphan)',
                              backgroundColor: 'var(--state-orphan-bg)',
                              border: '1px solid var(--state-orphan-border)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--state-orphan-dot)',
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
                              color: 'var(--state-orphan)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--state-orphan-dot)',
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
                              color: 'var(--color-primary-hover)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--state-resolved-dot)',
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
                              color: 'var(--color-primary-hover)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--state-resolved-dot)',
                                flexShrink: 0,
                              }}
                            />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
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
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
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
