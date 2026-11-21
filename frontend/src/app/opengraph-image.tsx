import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Omnicassion - Wedding & Event Planning Platform in India';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com').replace(/\/$/, '');
  const logoUrl = `${siteUrl}/images/omnilogo.avif`;

  return new ImageResponse(
    (
      <div
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(14,165,233,0.3) 0%, rgba(14,165,233,0) 35%), radial-gradient(circle at 82% 78%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 40%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, zIndex: 1 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <img
              src={logoUrl}
              width={56}
              height={56}
              alt="Omnicassion"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 600, opacity: 0.92 }}>OMNICASSION</span>
            <span style={{ fontSize: 16, opacity: 0.78 }}>Planning. Social. Celebrations.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, zIndex: 1 }}>
          <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
            India&apos;s Premier
            <br />
            All-in-One Planning and Social Platform
          </div>
          <div style={{ fontSize: 25, opacity: 0.9, maxWidth: 980 }}>
            Discover professionals, compare services, and manage your event journey in one place.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
            fontSize: 20,
            opacity: 0.9,
          }}
        >
          <span>Plan • Connect • Celebrate</span>
          <span style={{ opacity: 0.82 }}>omnicassion.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
