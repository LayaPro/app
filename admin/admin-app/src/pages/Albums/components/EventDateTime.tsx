import type { FC } from 'react';

interface EventDateTimeProps {
  fromDatetime?: string;
  toDatetime?: string;
}

export const EventDateTime: FC<EventDateTimeProps> = ({ fromDatetime, toDatetime }) => {
  if (!fromDatetime && !toDatetime) {
    return null;
  }

  const fromDate = fromDatetime ? new Date(fromDatetime) : null;
  const toDate = toDatetime ? new Date(toDatetime) : null;
  const isMultiDay = fromDate && toDate && fromDate.toDateString() !== toDate.toDateString();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}
    >
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ flexShrink: 0, marginTop: '0.125rem' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {isMultiDay ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {fromDate && (
            <div>
              <span style={{ fontStyle: 'italic', marginRight: '0.375rem' }}>from:</span>
              <span>
                {fromDate.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          )}
          {toDate && (
            <div>
              <span style={{ fontStyle: 'italic', marginRight: '0.375rem' }}>to:</span>
              <span>
                {toDate.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          )}
        </div>
      ) : (
        <span>
          {fromDate &&
            fromDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          {fromDate && toDate && ' - '}
          {toDate &&
            toDate.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
        </span>
      )}
    </div>
  );
};
