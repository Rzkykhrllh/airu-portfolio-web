import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'black',
        }}
      >
        {/* Bracket Icon - Four corners */}
        <div
          style={{
            position: 'relative',
            width: 24,
            height: 24,
            display: 'flex',
          }}
        >
          {/* Top Left Corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: 8,
              borderTop: '2px solid white',
              borderLeft: '2px solid white',
            }}
          />
          {/* Top Right Corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderTop: '2px solid white',
              borderRight: '2px solid white',
            }}
          />
          {/* Bottom Left Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 8,
              height: 8,
              borderBottom: '2px solid white',
              borderLeft: '2px solid white',
            }}
          />
          {/* Bottom Right Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderBottom: '2px solid white',
              borderRight: '2px solid white',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
