import { describe, expect, it } from 'vitest';
import { classifyUa, isDoNotTrack, refererHost } from './view-tracker';

describe('classifyUa', () => {
  it('returns browser for a real Chrome UA', () => {
    expect(
      classifyUa(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
    ).toBe('browser');
  });

  it('returns browser for a real Firefox UA', () => {
    expect(
      classifyUa(
        'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
      ),
    ).toBe('browser');
  });

  it('returns bot for Googlebot', () => {
    expect(
      classifyUa('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'),
    ).toBe('bot');
  });

  it('returns bot for Bingbot', () => {
    expect(
      classifyUa('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'),
    ).toBe('bot');
  });

  it('returns bot for facebookexternalhit', () => {
    expect(classifyUa('facebookexternalhit/1.1')).toBe('bot');
  });

  it('returns bot for Slackbot', () => {
    expect(classifyUa('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)')).toBe('bot');
  });

  it('returns bot for WhatsApp', () => {
    expect(classifyUa('WhatsApp/2.23.20.0 A')).toBe('bot');
  });

  it('returns bot for Discord previews', () => {
    expect(classifyUa('Mozilla/5.0 (compatible; Discordbot/2.0)')).toBe('bot');
  });

  it('returns bot for curl', () => {
    expect(classifyUa('curl/8.4.0')).toBe('bot');
  });

  it('returns unknown for null', () => {
    expect(classifyUa(null)).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    expect(classifyUa(undefined)).toBe('unknown');
  });

  it('returns unknown for empty string', () => {
    expect(classifyUa('')).toBe('unknown');
  });
});

describe('refererHost', () => {
  it('extracts host from a full URL', () => {
    expect(refererHost('https://example.com/foo?x=1#bar')).toBe('example.com');
  });

  it('extracts host with port', () => {
    expect(refererHost('http://localhost:3000/some/path')).toBe('localhost:3000');
  });

  it('returns null for an invalid URL', () => {
    expect(refererHost('not a url')).toBeNull();
  });

  it('returns null for null', () => {
    expect(refererHost(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(refererHost(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(refererHost('')).toBeNull();
  });

  it('strips path and query from the host', () => {
    expect(refererHost('https://google.com/search?q=opensignup')).toBe('google.com');
  });
});

describe('isDoNotTrack', () => {
  function fakeHeaders(map: Record<string, string>) {
    return {
      get: (name: string) => map[name.toLowerCase()] ?? null,
    };
  }

  it('returns true when DNT=1', () => {
    expect(isDoNotTrack(fakeHeaders({ dnt: '1' }))).toBe(true);
  });

  it('returns true when Sec-GPC=1', () => {
    expect(isDoNotTrack(fakeHeaders({ 'sec-gpc': '1' }))).toBe(true);
  });

  it('returns false when no signal headers present', () => {
    expect(isDoNotTrack(fakeHeaders({}))).toBe(false);
  });

  it('returns false when DNT=0', () => {
    expect(isDoNotTrack(fakeHeaders({ dnt: '0' }))).toBe(false);
  });

  it('returns false when DNT is some other value', () => {
    expect(isDoNotTrack(fakeHeaders({ dnt: 'unspecified' }))).toBe(false);
  });
});
