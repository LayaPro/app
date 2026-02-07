interface ScreenshotFrameProps {
  children?: React.ReactNode;
  className?: string;
  viewFrom?: 'left' | 'right';
}

export function ScreenshotFrame({ children, className = '', viewFrom = 'left' }: ScreenshotFrameProps) {
  return (
    <div className={`screenshot-3d-wrapper ${className}`}>
      <div className={`screenshot-3d-frame ${viewFrom === 'right' ? 'view-from-right' : ''}`}>
        <div className="screenshot-content">
          {/* Mac-style window controls */}
          <div className="mac-window-controls">
            <span className="mac-dot mac-dot-red"></span>
            <span className="mac-dot mac-dot-yellow"></span>
            <span className="mac-dot mac-dot-green"></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
