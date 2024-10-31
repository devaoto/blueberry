import axios from "npm:axios";
import { load } from "npm:cheerio";
import { RequestError } from "../errors/main.ts";

interface Response {
  code: number;
  description: string;
}

interface Artist {
  name: string;
  lfid?: string;
  slug?: string;
  is_primary?: boolean;
}

interface Album {
  id: string;
  title: string;
  releaseYear: number;
  coverArt: string;
  slug: string;
}

interface Track {
  lfid: string;
  rovi: string;
  gracenote: string;
  apple: number;
  deezer: number;
  spotify: string;
  isrcs: string[];
  instrumental: boolean;
  viewable: boolean;
  has_lrc: boolean;
  has_elrc: boolean;
  has_contentfilter: boolean;
  has_emotion: boolean;
  has_sentiment: boolean;
  title: string;
  titleSimple: string;
  duration: string;
  artists: Artist[];
  artist: Artist;
  score: number;
  slug: string;
  album: Album;
}

interface TrackResponse {
  response: Response;
  totalresults: number;
  totalpages: number;
  tracks: Track[];
}

interface ITranslationMap {
  de: string;
  ko: string;
  pt: string;
  th: string;
  ja: string;
}

interface ITrack {
  lfid: string;
  language: string;
  available_translations: string[];
  rovi: string;
  gracenote: string;
  apple: number;
  isrcs: string[];
  instrumental: boolean;
  viewable: boolean;
  has_lrc: boolean;
  has_elrc: boolean;
  has_contentfilter: boolean;
  has_emotion: boolean;
  has_sentiment: boolean;
  lrc_verified: boolean;
  elrc_verified: boolean;
  title: string;
  titleSimple: string;
  duration: string;
  artists: string[];
  artist: Record<string, unknown>;
  last_update: string;
  lyrics: string;
  lrc_version: string;
  copyright: string;
  writer: string;
  glp: string;
  slug: string;
  album: Record<string, unknown>;
}

interface IResponse {
  code: number;
  description: string;
}

interface ISongData {
  response: IResponse;
  track: ITrack;
}

interface IPageProps {
  songData: ISongData;
  artistSlug: string;
  albumSlug: string;
  countryCode: string;
  songIsInstrumental: boolean;
  languageToLyricTranslationMap: ITranslationMap;
}

interface IProps {
  pageProps: IPageProps;
}

export const getSlug = async (query: string) => {
  const url = `https://lyrics.lyricfind.com/api/v1/search?reqtype=default&territory=US&searchtype=track&all=${encodeURIComponent(
    query
  )}&alltracks=no&limit=1&output=json&useragent=Mozilla%2F5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML,+like+Gecko)+Chrome%2F129.0.0.0+Safari%2F537.36`;
  const response = await axios.get<TrackResponse>(url);

  return response.data.tracks[0].slug;
};

export const getLyrics = async (query: string) => {
  const proxy = "https://cors.ayoko.fun";

  const urls = (slug: string) => [
    `https://lyrics.lyricfind.com/lyrics/${slug}`,
    `${proxy}/https://lyrics.lyricfind.com/lyrics/${slug}`,
  ];
  const slug = await getSlug(query);
  const url =
    Math.floor(Math.random() * 2) === 0 ? urls(slug)[0] : urls(slug)[1];
  const response = await axios.get<string>(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });

  const $ = load(response.data);

  const script = $("#__NEXT_DATA__").text();

  if (!script) {
    throw new RequestError("Lyrics not found", 404);
  }

  const parsedData = JSON.parse(script);

  return parsedData.props as IProps;
};
