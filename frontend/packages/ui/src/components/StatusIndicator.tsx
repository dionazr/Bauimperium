import React from 'react';

interface StatusIndicatorProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  // Project
  DRAFT: 'bg-gray-400',
  PUBLISHED: 'bg-blue-500',
  IN_OFFER_PHASE: 'bg-yellow-500',
  IN_EXECUTION: 'bg-green-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-red-500',

  // Offer
  SENT: 'bg-blue-500',
  ACCEPTED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  EXPIRED: 'bg-gray-400',

  // Escrow
  FUNDED: 'bg-green-500',
  PARTIALLY_RELEASED: 'bg-blue-500',
  DISPUTED: 'bg-red-500',

  // Verification
  VERIFIED: 'bg-green-500',
  PENDING: 'bg-yellow-500',
  FAILED: 'bg-red-500',

  // Payment
  PAID: 'bg-green-500',
  OVERDUE: 'bg-red-500',

  // Generic
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-400',
  APPROVED: 'bg-green-500',
  RELEASED: 'bg-blue-500',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'sm',
}) => {
  const color = statusColors[status] || 'bg-gray-400';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${color} flex-shrink-0`} />
      {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
    </span>
  );
};
