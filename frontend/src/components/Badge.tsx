import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const variantStyles = {
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    CLASS_NOTES: { label: 'Class Notes', variant: 'primary' },
    DETAILED_NOTES: { label: 'Detailed Notes', variant: 'info' },
    IMPORTANT_QUESTIONS: { label: 'Imp. Questions', variant: 'warning' },
    QUESTION_BANK: { label: 'Question Bank', variant: 'primary' },
    PREVIOUS_YEAR_PAPERS: { label: 'PYQ Papers', variant: 'neutral' },
    MODEL_PAPERS: { label: 'Model Papers', variant: 'info' },
    TEXTBOOK_REFERENCES: { label: 'Textbook Ref', variant: 'success' },
    LAB_MANUAL: { label: 'Lab Manual', variant: 'success' },
    PRACTICAL_FILES: { label: 'Practical File', variant: 'neutral' },
    SYLLABUS: { label: 'Syllabus', variant: 'neutral' },
    OTHER: { label: 'Resource', variant: 'neutral' },
  };

  const item = map[category] || { label: category, variant: 'neutral' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="success">Published</Badge>;
    case 'SUBMITTED':
      return <Badge variant="warning">In Review</Badge>;
    case 'DRAFT':
      return <Badge variant="neutral">Draft</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Changes Requested</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

