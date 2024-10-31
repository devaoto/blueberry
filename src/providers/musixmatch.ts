import axios from "npm:axios";
import { getTrack } from "../spotify.ts";
import { getTrackISRC } from "../spotify.ts";
import { InternalServerError, RequestError } from "../errors/main.ts";

interface Header {
  status_code: number;
  execute_time: number;
  pid?: number;
  surrogate_key_list?: unknown[];
}

interface LyricsHeader {
  status_code: number;
  execute_time: number;
}

interface LyricsBody {
  lyrics_id: number;
  can_edit: number;
  check_validation_overridable: number;
  locked: number;
  published_status: number;
  action_requested: string;
  verified: number;
  restricted: number;
  instrumental: number;
  explicit: number;
  lyrics_body: string;
  lyrics_language: string;
  lyrics_language_description: string;
  script_tracking_url: string;
  pixel_tracking_url: string;
  html_tracking_url: string;
  lyrics_copyright: string;
  writer_list: unknown[];
  publisher_list: unknown[];
  backlink_url: string;
  updated_time: string;
}

interface SnippetBody {
  snippet_id: number;
  snippet_language: string;
  restricted: number;
  instrumental: number;
  snippet_body: string;
  script_tracking_url: string;
  pixel_tracking_url: string;
  html_tracking_url: string;
  updated_time: string;
}

interface Subtitle {
  subtitle_id: number;
  restricted: number;
  published_status: number;
  subtitle_body: string;
}

interface SubtitlesBody {
  subtitle_list: {
    subtitle: Subtitle;
  }[];
}

interface MacroCalls {
  "track.lyrics.get": {
    message: {
      header: LyricsHeader;
      body: {
        lyrics: LyricsBody;
      };
    };
  };
  "matcher.track.get": {
    message: {
      header: LyricsHeader;
      body: {
        track: {
          [key: string]: unknown;
        };
      };
    };
  };
  "track.snippet.get": {
    message: {
      header: LyricsHeader;
      body: {
        snippet: SnippetBody;
      };
    };
  };
  "track.subtitles.get": {
    message: {
      header: LyricsHeader & { available: number; instrumental: number };
      body: SubtitlesBody;
    };
  };
}

interface Body {
  macro_calls: MacroCalls;
}

interface LyricsResponse {
  message: {
    header: Header;
    body: Body;
  };
}

interface Sync {
  text: string;
  time: {
    total: number;
    minutes: number;
    seconds: number;
    hundredths: number;
  };
}

const MUSIXMATCH_USER_TOKEN =
  "200501593b603a3fdc5c9b4a696389f6589dd988e5a1cf02dfdce1";
const MUSIXMATCH_REQUEST_HEADERS = {
  authority: "apic-desktop.musixmatch.com",
  cookie: "x-mxm-token-guid=",
};

const getResponseQuery = async (query: string) => {
  const info = await getTrack(query);
  const baseURL = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&`;

  const params = new URLSearchParams();

  params.append("q_album", info.album.name);
  params.append("q_artist", info.artists[0].name);
  params.append("q_artists", info.artists.map((a) => a.name).join(","));
  params.append("q_track", info.name);
  params.append("track_spotify_id", info.uri);
  params.append("usertoken", MUSIXMATCH_USER_TOKEN);

  const finalURL = baseURL + params.toString();

  try {
    const response = await axios.get<LyricsResponse>(finalURL, {
      headers: MUSIXMATCH_REQUEST_HEADERS,
    });
    const body = response.data.message.body.macro_calls;

    return body;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 500) {
        throw new InternalServerError(
          error.message ? error.message : "An error occurred with the request.",
          error.response.status
        );
      } else {
        throw new RequestError(
          error.message ? error.message : "An error occurred with the request.",
          error.response?.status || 400
        );
      }
    } else {
      throw new InternalServerError();
    }
  }
};

const getResponseISRC = async (isrc: string) => {
  const info = await getTrackISRC(isrc);
  const baseURL = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&`;

  const params = new URLSearchParams();

  params.append("q_album", info.album.name);
  params.append("q_artist", info.artists[0].name);
  params.append("q_artists", info.artists.map((a) => a.name).join(","));
  params.append("q_track", info.name);
  params.append("track_spotify_id", info.uri);
  params.append("usertoken", MUSIXMATCH_USER_TOKEN);

  const finalURL = baseURL + params.toString();

  console.log(finalURL);

  try {
    const response = await axios.get<LyricsResponse>(finalURL, {
      headers: MUSIXMATCH_REQUEST_HEADERS,
    });
    const body = response.data.message.body.macro_calls;

    return body;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 500) {
        throw new InternalServerError(
          "An internal server error occurred.",
          error.response.status
        );
      } else {
        throw new RequestError(
          "An error occurred with the request.",
          error.response?.status || 400
        );
      }
    } else {
      throw new RequestError("An unknown error occurred.");
    }
  }
};

const getLyrics = async (query: string) => {
  const response = await getResponseQuery(query);
  return response["track.lyrics.get"].message.body.lyrics.lyrics_body as string;
};

const getLyricsFull = async (query: string) => {
  const response = await getResponseQuery(query);
  const matcherTrack = response["matcher.track.get"].message.body.track;
  const lyrics = response["track.lyrics.get"].message.body.lyrics as LyricsBody;

  return {
    track: matcherTrack,
    body: lyrics,
  };
};

const getLyricsISRC = async (isrc: string) => {
  const response = await getResponseISRC(isrc);
  return response["track.lyrics.get"].message.body.lyrics.lyrics_body as string;
};

const getLyricsFullISRC = async (isrc: string) => {
  const response = await getResponseISRC(isrc);
  const matcherTrack = response["matcher.track.get"].message.body.track;
  const lyrics = response["track.lyrics.get"].message.body.lyrics;

  return {
    track: matcherTrack,
    body: lyrics,
  };
};

const getSubtitles = async (query: string) => {
  const response = await getResponseQuery(query);
  return JSON.parse(
    response["track.subtitles.get"].message.body.subtitle_list[0].subtitle
      .subtitle_body
  ) as Sync[];
};

const getSubtitlesFull = async (query: string) => {
  const response = await getResponseQuery(query);

  // Parse the subtitle body as JSON
  const parsedSubtitleBody = JSON.parse(
    response["track.subtitles.get"].message.body.subtitle_list[0].subtitle
      .subtitle_body
  ) as Sync[];

  const restWithoutBody = {
    ...response["track.subtitles.get"].message.body.subtitle_list[0].subtitle,
  };

  return {
    ...restWithoutBody,
    subtitle_body: parsedSubtitleBody,
  };
};

const getSubtitlesISRC = async (isrc: string) => {
  const response = await getResponseISRC(isrc);
  return JSON.parse(
    response["track.subtitles.get"].message.body.subtitle_list[0].subtitle
      .subtitle_body
  ) as Sync[];
};

const getSubtitlesFullISRC = async (isrc: string) => {
  const response = await getResponseQuery(isrc);

  // Parse the subtitle body as JSON
  const parsedSubtitleBody = JSON.parse(
    response["track.subtitles.get"].message.body.subtitle_list[0].subtitle
      .subtitle_body
  ) as Sync[];

  const restWithoutBody = {
    ...response["track.subtitles.get"].message.body.subtitle_list[0].subtitle,
  };

  return {
    ...restWithoutBody,
    subtitle_body: parsedSubtitleBody,
  };
};

export {
  getLyrics,
  getLyricsFull,
  getLyricsISRC,
  getLyricsFullISRC,
  getSubtitles,
  getSubtitlesFull,
  getSubtitlesISRC,
  getSubtitlesFullISRC,
};
