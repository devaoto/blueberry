import axios from "npm:axios";

interface SpotifyTrack {
  album: {
    album_type: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
    href: string;
    id: string;
    images: { url: string; height: number; width: number }[];
    name: string;
    release_date: string;
    total_tracks: number;
    type: string;
    uri: string;
  };
  artists: { name: string }[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: { isrc: string };
  external_urls: { spotify: string };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ZmU1NTBhNzY5MjMyNDIxMThjNGE5ZDI2NzIwZGViMGU6MTFhZmZjMTBjOTM5NDczYmFhNjlhN2Q1YzRjOWIyMGI=`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Get ISRC
 * @param {string} query - The query to get isrc from
 * @returns {Promise<string>}} - ISRC
 */
export const getTrack = async (query: string) => {
  const accessToken = await getAccessToken();

  const searchParams = new URLSearchParams();
  searchParams.append("q", query);
  searchParams.append("type", "track");
  searchParams.append("limit", "1");

  const response = await axios.get<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response?.data;
  const track = data.tracks.items[0];

  return track;
};

export const getTrackISRC = async (isrc: string) => {
  const accessToken = await getAccessToken();

  const searchParams = new URLSearchParams();
  searchParams.append("q", `isrc:${isrc}`);
  searchParams.append("type", "track");
  searchParams.append("limit", "1");

  const response = await axios.get<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response?.data;
  const track = data.tracks.items[0];

  return track;
};
