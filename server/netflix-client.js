import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const NETFLIX_BASE = 'https://www.netflix.com';

function parseCookies(setCookieHeaders) {
  const cookies = {};
  if (!setCookieHeaders) return cookies;

  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    const parts = header.split(';')[0].split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = value;
    }
  }
  return cookies;
}

function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function commonHeaders(cookies = {}) {
  return {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `${NETFLIX_BASE}/login`,
    ...(Object.keys(cookies).length > 0 ? { 'Cookie': formatCookies(cookies) } : {}),
  };
}

/**
 * HEARO-style Netflix authentication.
 * This mirrors what HEARO does on Android via WebView:
 * 1. Load the login page (captures CSRF token + initial cookies)
 * 2. Submit credentials (captures session cookies)
 * 3. Validate the session
 */
export async function netflixLogin(email, password) {
  try {
    // Step 1: Fetch login page to get authURL (CSRF token) and initial cookies
    const loginPageRes = await axios.get(`${NETFLIX_BASE}/login`, {
      headers: commonHeaders(),
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const initialCookies = parseCookies(loginPageRes.headers['set-cookie']);
    const $ = cheerio.load(loginPageRes.data);

    const authURL = $('input[name="authURL"]').val() ||
      loginPageRes.data.match(/name="authURL"\s+value="([^"]+)"/)?.[1] || '';

    if (!authURL) {
      return {
        success: false,
        error: 'Could not retrieve auth token from Netflix login page. Netflix may be blocking automated requests.',
        code: 'AUTH_TOKEN_MISSING',
      };
    }

    const allCookies = { ...initialCookies };

    // Step 2: Submit credentials (like HEARO's WebView form submission)
    const loginRes = await axios.post(
      `${NETFLIX_BASE}/login`,
      new URLSearchParams({
        userLoginId: email,
        password: password,
        rememberMe: 'true',
        flow: 'websiteSignUp',
        mode: 'login',
        action: 'loginAction',
        withFields: 'rememberMe,nextPage,userLoginId,password,countryCode,countryIsoCode',
        authURL: authURL,
        nextPage: '',
        showPassword: '',
        countryCode: '+1',
        countryIsoCode: 'US',
      }).toString(),
      {
        headers: {
          ...commonHeaders(allCookies),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': NETFLIX_BASE,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      }
    );

    const sessionCookies = parseCookies(loginRes.headers['set-cookie']);
    Object.assign(allCookies, sessionCookies);

    // Check for successful login indicators
    const hasNetflixId = !!allCookies['NetflixId'] || !!allCookies['netflixId'];
    const hasSecureId = !!allCookies['SecureNetflixId'] || !!allCookies['secureNetflixId'];
    const isRedirect = loginRes.status >= 300 && loginRes.status < 400;
    const redirectsToProfile = loginRes.headers['location']?.includes('/browse') ||
      loginRes.headers['location']?.includes('/profiles');

    if ((hasNetflixId || hasSecureId) || (isRedirect && redirectsToProfile)) {
      return {
        success: true,
        cookies: allCookies,
        redirectUrl: loginRes.headers['location'] || '/browse',
      };
    }

    // Check for specific error messages in response
    const responseBody = typeof loginRes.data === 'string' ? loginRes.data : '';
    if (responseBody.includes('Incorrect password') || responseBody.includes('incorrect password')) {
      return { success: false, error: 'Incorrect password. Please try again.', code: 'WRONG_PASSWORD' };
    }
    if (responseBody.includes('Cannot find an account') || responseBody.includes('cannot find')) {
      return { success: false, error: 'No Netflix account found with that email.', code: 'ACCOUNT_NOT_FOUND' };
    }
    if (responseBody.includes('captcha') || responseBody.includes('recaptcha')) {
      return { success: false, error: 'Netflix is requiring CAPTCHA verification. Try again later.', code: 'CAPTCHA_REQUIRED' };
    }
    if (responseBody.includes('too many') || loginRes.status === 429) {
      return { success: false, error: 'Too many login attempts. Please wait and try again.', code: 'RATE_LIMITED' };
    }

    return {
      success: false,
      error: 'Login failed. Netflix may have changed their login flow or is blocking this request.',
      code: 'LOGIN_FAILED',
      status: loginRes.status,
    };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return { success: false, error: 'Cannot reach Netflix servers. Check your internet connection.', code: 'NETWORK_ERROR' };
    }
    return {
      success: false,
      error: `Authentication error: ${err.message}`,
      code: 'UNEXPECTED_ERROR',
    };
  }
}

/**
 * Fetch Netflix profiles using authenticated cookies.
 * This is what HEARO does after capturing the session cookies.
 */
export async function getNetflixProfiles(cookies) {
  try {
    const res = await axios.get(`${NETFLIX_BASE}/browse`, {
      headers: commonHeaders(cookies),
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const body = typeof res.data === 'string' ? res.data : '';

    // Netflix embeds profile data in the page as JSON
    const profileMatch = body.match(/netflix\.falcorCache\s*=\s*({.*?});/s) ||
      body.match(/"profiles"\s*:\s*({[^}]+})/s) ||
      body.match(/profilesList.*?"(\w+)"\s*:\s*\{[^}]*"profileName"/gs);

    const profiles = [];
    const $ = cheerio.load(body);

    // Try parsing profile gate page
    $('.profile-link, .choose-profile .profile-icon, [data-profile-guid]').each((_, el) => {
      const $el = $(el);
      const name = $el.find('.profile-name').text().trim() ||
        $el.attr('aria-label') ||
        $el.text().trim();
      const guid = $el.attr('data-profile-guid') || $el.attr('href')?.match(/profile=([^&]+)/)?.[1];
      const avatar = $el.find('img').attr('src') || '';
      if (name) {
        profiles.push({ id: guid || `profile-${profiles.length}`, name, avatar });
      }
    });

    if (profiles.length > 0) {
      return { success: true, profiles };
    }

    // If page scraping didn't work, try the Falcor cache
    if (profileMatch) {
      try {
        const json = JSON.parse(profileMatch[1]);
        const parsed = Object.values(json).filter(v => v?.profileName);
        for (const p of parsed) {
          profiles.push({
            id: p.guid || `profile-${profiles.length}`,
            name: p.profileName || 'Profile',
            avatar: p.avatar?.url || '',
          });
        }
        if (profiles.length > 0) return { success: true, profiles };
      } catch {}
    }

    return {
      success: false,
      error: 'Could not parse Netflix profiles. Session may have expired.',
      code: 'PROFILE_PARSE_ERROR',
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch profiles: ${err.message}`,
      code: 'PROFILES_FETCH_ERROR',
    };
  }
}

/**
 * Demo/mock data for when Netflix blocks requests or user wants to try without credentials.
 * This lets the full flow work for demonstration purposes.
 */
export function getDemoProfiles() {
  return [
    { id: 'demo-1', name: 'Alex', avatar: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxga/AAAABfjwXqIYd3kCEU5rIe3CBatU0gFvMgdBBgJhGB_yYDPMQ5V7eFBCuy6Y9fMFZMIbOF44RXLMqFEj1IRd3JXBJPY.png?r=229' },
    { id: 'demo-2', name: 'Jordan', avatar: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxga/AAAABUyxmAPHIG9Yk1hSLRpS3trY0LfxhzfJjOPaSqv-3HNmNdlKG3K_Xs-HOJwnQHOvKkYmrLMxMgRHLMmK9xcXpBw.png?r=229' },
    { id: 'demo-3', name: 'Sam', avatar: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxga/AAAABdYJV5wt63AcBuSmp_ogehha2iHGz5TkRg5gEb0JQJr_hBDpSMChAVJwxnpT2_WIxEqbOBPfkMHJf0iuf4LiGIx6rE.png?r=229' },
    { id: 'demo-4', name: 'Kids', avatar: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxga/AAAABYo85Lg6V-FLxAiBrHPGjhDx9TeU3GhjKRVF3LzpECyIjmPMmRRLBPz_VgKSfsnU3DkPpai9N4Xg5enjLleDxxNpxQ.png?r=229' },
  ];
}

export function getDemoContent() {
  return [
    {
      category: 'Trending Now',
      titles: [
        { id: 't1', title: 'Stranger Things', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABcFOHzWQF4MjNLN1pUONPgPSLrmJtMzAXYaOQo5QMzdfGNSU3kPBtjwarJqT5c0MXuoNpJyYHzhbqmGtEs6r8MPIIP0mLnOz4EYZ.webp?r=5e0', year: 2024, rating: 'TV-14' },
        { id: 't2', title: 'Wednesday', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABfMsKaMDH0P9v-fXYJbPNd28VQJmQ6DxX0k_3JdTXAHAdMqCHZEW4-jCPLkfNOL-H1_8bPbhYxQ7mVHp-bJ2qNPjBJJ-Ep4n4U7d.webp?r=28a', year: 2024, rating: 'TV-14' },
        { id: 't3', title: 'The Night Agent', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQ4e5VqVABaGPPTjClEqijSY0qH-GIjIQc1EYJmJ7IJLY0m0DN1VZ0dSfNO4sCF4MHmjxbF_xwXCacJpoO_TaYrjDG6Trl0fslX_.webp?r=03a', year: 2025, rating: 'TV-MA' },
        { id: 't4', title: 'Squid Game', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABTrK7-LGJph3M0GNyxCFOcbMPTQcgR7KB-AqOBI3eQMR5xtL_k2YfIPiqjFdD2lChBv7pWkP1fDBxuiY-QvYmvfEp1F3wgKY8EJJ.webp?r=936', year: 2024, rating: 'TV-MA' },
        { id: 't5', title: 'Black Mirror', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABb2P0A0N1pLZrCRf8RkG6L_QdWR2fc3FJm9dlJjfpjQ6XhIV-EQHP6dF4O5hn0eDf8s8yP32N6l3oqL2W7pM_aXPjR3fnZDHzEiN.webp?r=f99', year: 2025, rating: 'TV-MA' },
      ],
    },
    {
      category: 'Popular on Netflix',
      titles: [
        { id: 't6', title: 'The Witcher', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABSqw-B_ZCPBGJlWQ_g_cN_HNl_UQnN_oPjIxIkfOxOnL2GKL3WT5jTjZVm-q_2Q6UMVLMU1b_qO7Kaq_V0eNJb1g6iSr_NJM7S1K.webp?r=7ac', year: 2024, rating: 'TV-MA' },
        { id: 't7', title: 'Ozark', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABS9kEv1Mdy-agZFCkqh9IUEb1ENj_BaYtM36v3l4oTBjJVB1S7s-JfPKn2ZN_0G_V__u2WOLiQtKsQzIcUqJrlP62bB3Uo4pJR6A.webp?r=c5b', year: 2022, rating: 'TV-MA' },
        { id: 't8', title: 'Bridgerton', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABdMqsq-jHXUmU1M9rRKU_BnWzWb_J_h4iUQ6WPZkQHzQT5sYM59JJZL-hMCDOGjFfMiT-D64GPLHVnBFhK5I1-DKJO2nKYTjxqBY.webp?r=066', year: 2024, rating: 'TV-MA' },
        { id: 't9', title: 'Money Heist', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABXFkpL4oSt4Isf4hHWQ4C3BVlQ6sZ2IgXdQ23fmCgzJMi-4_g3b7PSbFRFkQmQCHh16gPbRfQYNb3q8wR3FxVKPK97sF_4kDQhBI.webp?r=5a6', year: 2021, rating: 'TV-MA' },
        { id: 't10', title: 'Dark', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABTRp7gf-s2FxCFmZfhP0FiHGLpN3bSy8jG3DjJlJSb2TpLFfbF9c2bQ0HCxhJt4k5oM6xBllhJMZ7LZoJ56gBmqCCgQX-6I2sP2.webp?r=a69', year: 2020, rating: 'TV-MA' },
      ],
    },
    {
      category: 'Watch Together Picks',
      titles: [
        { id: 't11', title: 'Glass Onion', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABTv1IiJf1h4pE2Y0ykaO2Qbp5m4cI6f0b6vLqnCHTHZ0rMRsqPQ-f9oWQ9G-_xEDwp0A56lKS3C13BYPgdEMhDsxaVQ-9FHQGQ2l.webp?r=1ec', year: 2022, rating: 'PG-13' },
        { id: 't12', title: 'Don\'t Look Up', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABVhJV1rRTlMyVV_b3JHxhIbN_3kXlXC_NbXjZ_FYdPq1I_H0hB_GW-kS9Wm42mJtZUqVQUhLhXq-h67nQ1jN2BqC-JwCSNpHx-HN.webp?r=79c', year: 2021, rating: 'R' },
        { id: 't13', title: 'Extraction 2', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABWMp32cRvBGi6FRJOy8sT5i-SfV0XmG_bWqE3VTZgGHq8N3k2TzLjNcEOVPbBQC9KvRf2bqKnQJ1xkPJ1f4bJW-VJlJChxQh-WC8.webp?r=fe9', year: 2023, rating: 'R' },
        { id: 't14', title: 'The Adam Project', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABSwAcNMVr6Qlv1QSJYlLRTwb5Y1yFCrVVQ3C2bbqHPXkRRbZqZdR1Bk2t_IbLQOvz4ZqM6cJpqUNb8Q04fT2_ZEgchvyj5VNuLbQ.webp?r=c2b', year: 2022, rating: 'PG-13' },
        { id: 't15', title: 'Red Notice', image: 'https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABaIrz-XbvB0G6Ljs93ViYeHRN6kHJWOq1ZdslNb1-q5aGjNAsCfDAhJwpLFCFQUPeD8yF5hNfDpaQ0rMPVYg9S3BxKIKNlmM8_QN.webp?r=59d', year: 2021, rating: 'PG-13' },
      ],
    },
  ];
}
