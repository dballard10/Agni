import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, rightContent }: PageHeaderProps) => {
  return (
    <div className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b-2 border-slate-700/80 transition-all">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <h1 className="text-xl font-bold text-slate-100 justify-self-start">
          {title}
        </h1>
        {subtitle && (
          <div className="justify-self-center text-center">{subtitle}</div>
        )}
        {rightContent && (
          <div className="justify-self-end flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
