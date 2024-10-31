import { Hono } from "hono";
import {
  getLyrics,
  getLyricsFull,
  getSubtitles,
  getSubtitlesFull,
} from "./providers/musixmatch.ts";
import { getLyrics as getLyricsFind } from "./providers/lyric-find.ts";
import { cors } from "npm:hono/cors";
import { prettyJSON } from "npm:hono/pretty-json";
import { InternalServerError, RequestError } from "./errors/main.ts";

const app = new Hono();

app.use(cors());
app.use(prettyJSON());

app.get("/", (c) => c.text("Welcome to Blueberry Lyrics API!"));
app.get("/lyrics/:query", async (c) => {
  const { query } = c.req.param();
  let { provider, full } = c.req.query() as {
    provider?: string;
    full?: string;
  };

  if (!query) {
    return c.json({ message: "No query provided" }, 400);
  }

  if (!provider) {
    provider = "musixmatch";
  }

  if (!full) {
    full = undefined;
  }

  if (provider === "musixmatch") {
    if (full) {
      try {
        return c.json(await getLyricsFull(query));
      } catch (error) {
        if (error instanceof RequestError) {
          return c.json(
            { message: error.message },
            // @ts-expect-error: Lie bitch lie
            error.statusCode
          );
        } else if (error instanceof InternalServerError) {
          return c.json(
            { message: error.message },
            // @ts-expect-error: Lie bitch lie
            error.statusCode
          );
        } else {
          return c.json({ message: (error as Error).message }, 500);
        }
      }
    } else {
      return c.json({
        lyrics: await getLyrics(query),
      });
    }
  } else if (provider === "lyric-find") {
    if (full) {
      return c.json(await getLyricsFind(query));
    } else {
      return c.json({
        lyrics: (await getLyricsFind(query)).pageProps.songData.track.lyrics,
      });
    }
  } else {
    return c.json({ message: "Invalid provider" }, 400);
  }
});

app.get("/synced/:query", async (c) => {
  const { query } = c.req.param();
  const { full } = c.req.query() as { full?: string };

  if (!query) {
    return c.json({ message: "No query provided" }, 400);
  }

  if (full) {
    return c.json(await getSubtitlesFull(query));
  } else {
    return c.json(await getSubtitles(query));
  }
});

Deno.serve(app.fetch);
