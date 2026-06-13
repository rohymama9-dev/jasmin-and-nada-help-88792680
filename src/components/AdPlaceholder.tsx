import MotivationalMarquee from './MotivationalMarquee';

interface AdPlaceholderProps {
  size?: 'banner' | 'rectangle';
}

/**
 * Ad slot — currently rendered as a CSS-only infinite-looping motivational
 * quotes marquee (mobile-friendly, no JS animation, GPU-composited).
 */
const AdPlaceholder = ({ size = 'banner' }: AdPlaceholderProps) => {
  if (size === 'banner') return <MotivationalMarquee />;
  return (
    <div className="w-full">
      <MotivationalMarquee />
    </div>
  );
};

export default AdPlaceholder;
