import 'dotenv/config';
import { create } from 'xmlbuilder2';
import * as fs from 'fs';
import * as dayjs from 'dayjs';

type Episode = {
  title: string;
  description: string;
  filename: string;   // Aries_2025-09-16_to_2025-09-22.mp3
  pubDate: string;    // ISO (will convert to RFC-2822)
  explicit?: boolean;
  guid?: string;
};

const AUDIO_BASE_URL = process.env.AUDIO_BASE_URL || '';
const PODCAST_TITLE = process.env.PODCAST_TITLE || 'AstroStar Insights';
const PODCAST_LINK = process.env.PODCAST_LINK || 'https://AstroStarInsights.com';
const PODCAST_DESCRIPTION = process.env.PODCAST_DESCRIPTION || 'Data-driven weekly horoscopes.';
const PODCAST_LANGUAGE = process.env.PODCAST_LANGUAGE || 'en-us';
const PODCAST_AUTHOR = process.env.PODCAST_AUTHOR || 'AstroStar Insights';

const rfc2822 = (iso: string) => dayjs(iso).format('ddd, DD MMM YYYY HH:mm:ss ZZ');

function loadEpisodes(): Episode[] {
  const json = fs.readFileSync('./episodes.json', 'utf8');
  return JSON.parse(json);
}

function buildRss(items: Episode[]) {
  const feed = {
    rss: {
      '@version': '2.0',
      '@xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
      channel: {
        title: PODCAST_TITLE,
        link: PODCAST_LINK,
        description: PODCAST_DESCRIPTION,
        language: PODCAST_LANGUAGE,
        'itunes:author': PODCAST_AUTHOR,
        'itunes:explicit': 'false',
        item: items.map(ep => ({
          title: ep.title,
          description: { '#': `<![CDATA[${ep.description}]]>` },
          enclosure: { '@url': `${AUDIO_BASE_URL}/${encodeURIComponent(ep.filename)}`, '@type': 'audio/mpeg' },
          guid: { '@isPermaLink': 'false', '#': ep.guid || ep.filename },
          pubDate: rfc2822(ep.pubDate),
          'itunes:explicit': ep.explicit ? 'true' : 'false',
          'itunes:author': PODCAST_AUTHOR
        }))
      }
    }
  };
  return create(feed).end({ prettyPrint: true });
}

const episodes = loadEpisodes();
const xml = buildRss(episodes);
fs.writeFileSync('./podcast.xml', xml, 'utf8');
console.log('✓ Built podcast.xml');
