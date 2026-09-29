import React, { useState } from 'react';
import { PlusCircle, DollarSign, Store, MapPin } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import type { TransactionItem, TransactionStatus } from '../types/cases';
import type { ChannelType } from '../types/protocol';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (txn: TransactionItem) => void;
}

const CATEGORIES = [
  'Software & Technology',
  'Dining & Hospitality',
  'Retail & Shopping',
  'Travel & Transportation',
  'Entertainment & Media',
  'Groceries & Supermarket',
  'Internal Transfer',
  'Payroll & Income',
];

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [channel, setChannel] = useState<ChannelType | 'pos'>('web');
  const [status, setStatus] = useState<TransactionStatus>('unrecognized');
  const [location, setLocation] = useState('Online Checkout · Card Not Present');
  const [cycle, setCycle] = useState<'current' | 'previous'>('current');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      setError('Please provide a merchant name.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid transaction amount.');
      return;
    }

    const randomId = `txn_${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-US', { weekday: 'short' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newTxn: TransactionItem = {
      id: randomId,
      date: formattedDate,
      merchant: merchant.trim(),
      category,
      amount: parsedAmount,
      currency: 'USD',
      location: location.trim() || 'Online Transaction',
      canDispute: status !== 'cleared',
      status,
      channel,
      cycle,
    };

    onAddTransaction(newTxn);
    // Reset fields
    setMerchant('');
    setAmount('');
    setLocation('Online Checkout · Card Not Present');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Transaction"
      subtitle="Add a real-time card or account transaction to test cross-channel disputing and late binding."
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leftIcon={<PlusCircle size={15} />} onClick={handleSubmit}>
            Record Transaction
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        {error && (
          <div
            style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-sm)',
              color: '#be123c',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Merchant Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
            Merchant Name *
          </label>
          <Input
            placeholder="e.g. Acme Cloud Corp, Blue Bottle Coffee, Delta Air Lines"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Store size={15} color="#94a3b8" />}
            required
          />
        </div>

        {/* Amount & Currency */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Amount (USD) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 149.99"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<DollarSign size={15} color="#94a3b8" />}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Billing Cycle
            </label>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value as 'current' | 'previous')}
              style={{
                width: '100%',
                padding: '0.5625rem 0.75rem',
                fontSize: '0.875rem',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="current">Current Cycle</option>
              <option value="previous">Previous Cycle</option>
            </select>
          </div>
        </div>

        {/* Category & Channel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5625rem 0.75rem',
                fontSize: '0.875rem',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Channel Origin
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5625rem 0.75rem',
                fontSize: '0.875rem',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="web">Web Portal (Online)</option>
              <option value="mobile">Mobile App (In-App)</option>
              <option value="pos">In-Store POS Terminal</option>
              <option value="call">Telephone / IVR Order</option>
              <option value="branch">Branch Teller Desk</option>
            </select>
          </div>
        </div>

        {/* Initial Status */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
            Initial Transaction Status
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { id: 'unrecognized', label: 'Unrecognized', hint: 'Disputable' },
              { id: 'eligible', label: 'Eligible', hint: 'Disputable' },
              { id: 'cleared', label: 'Cleared', hint: 'Settled' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id as TransactionStatus)}
                style={{
                  padding: '0.625rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: status === st.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: status === st.id ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: status === st.id ? '#1d4ed8' : '#0f172a' }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.1rem' }}>
                  {st.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location / Billing Method Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
            Location / Terminal Detail
          </label>
          <Input
            placeholder="e.g. Downtown POS Terminal 4, Stripe Billing ACH"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin size={15} color="#94a3b8" />}
          />
        </div>
      </form>
    </Modal>
  );
};
