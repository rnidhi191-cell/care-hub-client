import companyLogo from '../assets/code_underscore.png';

export default function Logo({ compact = false, showName = true, className = '' }) {
  return (
    <div className={`company-logo ${compact ? 'company-logo--compact' : ''} ${className}`.trim()}>
      <img className="company-logo__image" src={companyLogo} alt="CARE Hub company logo" />
      {showName && !compact && (
        <div className="company-logo__copy">
          <span className="company-logo__name">CARE HUB</span>
          <span className="company-logo__tagline">Enterprise Performance</span>
        </div>
      )}
    </div>
  );
}
