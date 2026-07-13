import { CAMERA_LINKS, type CameraLink } from './cameraLinks';
import './cameras.css';

interface CameraPanelProps {
  open: boolean;
  onClose: () => void;
}

const KIND_LABELS: Record<CameraLink['kind'], string> = {
  video: 'Watch — broadcast & onboard cameras',
  audio: 'Listen — race audio & scanner',
  timing: 'Official timing & scoring',
};

const KIND_ORDER: CameraLink['kind'][] = ['video', 'audio', 'timing'];

export function CameraPanel({ open, onClose }: CameraPanelProps) {
  if (!open) return null;
  return (
    <>
      <div className="camera-overlay" onClick={onClose} />
      <aside className="camera-panel" aria-label="Watch and listen options">
        <button className="camera-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Watch &amp; Listen</h2>
        <p className="camera-note">
          In-car and on-car cameras are part of NASCAR's official broadcast packages — there is no
          public feed to embed. These open the official options in a new tab.
        </p>
        {KIND_ORDER.map((kind) => (
          <div key={kind}>
            <div className="camera-group-title">{KIND_LABELS[kind]}</div>
            {CAMERA_LINKS.filter((l) => l.kind === kind).map((link) => (
              <a
                key={link.label}
                className="camera-link"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="cam-kind">{kind === 'video' ? <VideoIcon /> : kind === 'audio' ? <AudioIcon /> : <TimingIcon />}</span>
                <span>
                  <div className="cam-label">{link.label}</div>
                  <div className="cam-desc">{link.description}</div>
                </span>
                <span className="ext">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

const AudioIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);

const TimingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" />
  </svg>
);
