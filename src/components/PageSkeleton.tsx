import type { CSSProperties } from 'react';

type SkeletonVariant = 'dashboard' | 'inventory' | 'table' | 'loans' | 'reports' | 'requests';

interface PageSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
}

function SkeletonLine({ width = '100%', height = 12 }: { width?: string; height?: number }) {
  return <div className="skeletonBlock" style={{ width, height }} />;
}

function TableRows({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeletonTable" style={{ '--skeleton-columns': columns } as CSSProperties}>
      <div className="skeletonTableHead">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonLine key={index} width={index === 0 ? '54%' : '72%'} height={10} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="skeletonTableRow" key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLine key={colIndex} width={colIndex === 1 ? '86%' : '64%'} height={13} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function PageSkeleton({ variant = 'table', rows = 5 }: PageSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className="skeletonPage">
        <div className="skeletonStatsGrid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeletonCard" key={index}>
              <div className="skeletonCardHeader">
                <SkeletonLine width="42%" height={13} />
                <div className="skeletonCircle" />
              </div>
              <SkeletonLine width="28%" height={30} />
              <SkeletonLine width="56%" height={11} />
            </div>
          ))}
        </div>
        <div className="skeletonSectionHeader">
          <SkeletonLine width="210px" height={20} />
          <SkeletonLine width="120px" height={14} />
        </div>
        <TableRows rows={4} columns={5} />
        <div className="skeletonTwoCol">
          <div className="skeletonPanel" />
          <div className="skeletonPanel" />
        </div>
      </div>
    );
  }

  if (variant === 'inventory') {
    return (
      <div className="skeletonPage">
        <div className="skeletonToolbar">
          <SkeletonLine width="100%" height={52} />
          <div className="skeletonPills">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonLine key={index} width={`${72 + index * 10}px`} height={36} />
            ))}
          </div>
        </div>
        <div className="skeletonGrid">
          {Array.from({ length: rows }).map((_, index) => (
            <div className="skeletonProductCard" key={index}>
              <SkeletonLine height={150} />
              <SkeletonLine width="70%" height={16} />
              <SkeletonLine width="38%" height={13} />
              <SkeletonLine height={42} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'loans') {
    return (
      <div className="skeletonPage">
        <div className="skeletonHeaderBlock">
          <SkeletonLine width="280px" height={28} />
          <SkeletonLine width="460px" height={14} />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div className="skeletonLoanCard" key={index}>
            <SkeletonLine width="82px" height={82} />
            <div className="skeletonFlexGrow">
              <SkeletonLine width="45%" height={18} />
              <SkeletonLine width="70%" height={13} />
              <SkeletonLine width="52%" height={13} />
            </div>
            <SkeletonLine width="150px" height={42} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'reports') {
    return (
      <div className="skeletonPage">
        <div className="skeletonHeaderBlock">
          <SkeletonLine width="340px" height={28} />
          <SkeletonLine width="560px" height={14} />
        </div>
        <div className="skeletonStatsGrid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeletonCard" key={index}>
              <SkeletonLine width="46px" height={46} />
              <SkeletonLine width="52%" height={13} />
              <SkeletonLine width="35%" height={22} />
            </div>
          ))}
        </div>
        <TableRows rows={rows} columns={4} />
        <div className="skeletonTwoCol">
          <div className="skeletonPanel" />
          <div className="skeletonPanel" />
        </div>
      </div>
    );
  }

  if (variant === 'requests') {
    return (
      <div className="skeletonPage">
        <div className="skeletonPills">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLine key={index} width={`${120 + index * 18}px`} height={42} />
          ))}
        </div>
        <TableRows rows={rows} columns={5} />
      </div>
    );
  }

  return (
    <div className="skeletonPage">
      <TableRows rows={rows} columns={5} />
    </div>
  );
}
