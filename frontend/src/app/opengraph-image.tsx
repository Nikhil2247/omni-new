import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Omnicassion - Event Planning Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 80, fontWeight: 'bold' }}>✨</span>
          <span style={{ fontSize: 72, fontWeight: 'bold', marginLeft: 20 }}>Omnicassion</span>
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          India's Premier Event Planning Platform
        </div>
        <div style={{ fontSize: 24, opacity: 0.8, marginTop: 20 }}>
          Plan • Discover • Celebrate
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
