import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  id = 'empty-state-card'
}) => {
  return (
    <div
      id={id}
      className="w-full flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-[#DDE3E8] text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#66acd7]/15 flex items-center justify-center text-[#2F6F9C] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[#111111]">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-md mt-1.5 leading-relaxed">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#2F6F9C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#66acd7]" />
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 bg-white border border-[#DDE3E8] hover:bg-[#F5F7F9] text-[#111111] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
