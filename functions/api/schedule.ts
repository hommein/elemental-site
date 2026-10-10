import { weekSchedule } from "../_lib";
interface Env { DB: D1Database }

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  return Response.json(await weekSchedule(env, url.searchParams.get("week")), {
    headers: { "cache-control": "no-store" },
  });
};
