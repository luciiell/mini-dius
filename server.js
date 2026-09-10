const express = require('express');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 8787;

const DEFAULT_BACKGROUND =
  'https://www.image2url.com/r2/default/images/1789074415076-cf294e99-5307-4993-96ab-1907f3e6dcdf.png';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch image: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function toDataUri(buffer, mime = 'image/png') {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

app.get('/render-profile', async (req, res) => {
  try {
    const {
      displayName = 'Dreamer',
      username = '',
      avatarUrl = '',
      bio = 'A blank page in the Dream Archive.',
      level = '1',
      xp = '0',
      coins = '0',
      pets = '0',
      cards = '0',
      gems = '0',
      lootboxes = '0',
      backgroundUrl = DEFAULT_BACKGROUND
    } = req.query;

    const backgroundBuffer = await fetchBuffer(backgroundUrl);
    const backgroundData = toDataUri(backgroundBuffer);

    let avatarMarkup = '';

    if (avatarUrl) {
      try {
        const avatarBuffer = await fetchBuffer(avatarUrl);
        const avatarData = toDataUri(avatarBuffer);

        avatarMarkup = `
          <defs>
            <clipPath id="avatarClip">
              <circle cx="115" cy="115" r="72"/>
            </clipPath>
          </defs>

          <image
            href="${avatarData}"
            x="43"
            y="43"
            width="144"
            height="144"
            preserveAspectRatio="xMidYMid slice"
            clip-path="url(#avatarClip)"
          />

          <circle
            cx="115"
            cy="115"
            r="75"
            fill="none"
            stroke="#ffffff"
            stroke-width="5"
          />
        `;
      } catch (error) {
        console.warn('Avatar could not be loaded:', error.message);
      }
    }

    const svg = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1024"
        height="700"
        viewBox="0 0 1024 700"
      >
        <defs>
          <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.58"/>
          </linearGradient>
        </defs>

        <image
          href="${backgroundData}"
          x="0"
          y="0"
          width="1024"
          height="700"
          preserveAspectRatio="xMidYMid slice"
        />

        <rect
          x="0"
          y="0"
          width="1024"
          height="700"
          fill="url(#overlay)"
        />

        <rect
          x="24"
          y="24"
          width="976"
          height="652"
          rx="30"
          fill="#ffffff"
          fill-opacity="0.22"
          stroke="#ffffff"
          stroke-opacity="0.75"
          stroke-width="3"
        />

        ${avatarMarkup}

        <text
          x="220"
          y="90"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="700"
          fill="#25222b"
        >${escapeXml(displayName)}</text>

        <text
          x="220"
          y="130"
          font-family="Arial, sans-serif"
          font-size="23"
          fill="#4d4855"
        >${escapeXml(username)}</text>

        <text
          x="220"
          y="177"
          font-family="Arial, sans-serif"
          font-size="24"
          fill="#302c36"
        >${escapeXml(bio)}</text>

        <line
          x1="55"
          y1="225"
          x2="969"
          y2="225"
          stroke="#ffffff"
          stroke-opacity="0.8"
          stroke-width="2"
        />

        <text
          x="65"
          y="275"
          font-family="Arial, sans-serif"
          font-size="24"
          font-weight="700"
          fill="#302c36"
        >Stats</text>

        <text x="65" y="320" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          Level: ${escapeXml(level)}
        </text>

        <text x="65" y="360" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          XP: ${escapeXml(xp)}
        </text>

        <text x="65" y="400" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          CloudCoins: ${escapeXml(coins)}
        </text>

        <text
          x="540"
          y="275"
          font-family="Arial, sans-serif"
          font-size="24"
          font-weight="700"
          fill="#302c36"
        >Collection</text>

        <text x="540" y="320" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          Pets: ${escapeXml(pets)}
        </text>

        <text x="540" y="360" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          Cards: ${escapeXml(cards)}
        </text>

        <text x="540" y="400" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          Gems: ${escapeXml(gems)}
        </text>

        <text x="540" y="440" font-family="Arial, sans-serif" font-size="25" fill="#302c36">
          Lootboxes: ${escapeXml(lootboxes)}
        </text>

        <text
          x="65"
          y="535"
          font-family="Arial, sans-serif"
          font-size="24"
          font-weight="700"
          fill="#302c36"
        >Mini-dius</text>

        <text
          x="65"
          y="575"
          font-family="Arial, sans-serif"
          font-size="21"
          fill="#302c36"
        >Your profile, your collection, your dream archive.</text>
      </svg>
    `;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Profile rendering failed.',
      details: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('Mini-dius profile renderer is running.');
});

app.listen(PORT, () => {
  console.log(`Profile renderer running at http://localhost:${PORT}`);
});
