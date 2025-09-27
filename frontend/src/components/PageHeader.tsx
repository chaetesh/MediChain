'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-lg text-gray-600">{description}</p>
          )}
        </div>
        {children && (
          <div className="mt-4 sm:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
