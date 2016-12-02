export default async (ctx, next) => {
  ctx.status = 200
  ctx.body = {
    response_type: 'ephemeral',
    text:
`This bot lets you retrieve information from Kitsu.io.
You can search users, anime, and manga in the default
compact mode, or in extended mode. By logging in with
your Kitsu credentials via \`/login\`, you can enable
additional features, specifically following users and
adding/editing media. If you don't have an account,
head over to ${process.env.KITSU_HOST} to get started.

Commands:
  /user [(ex)tended] [username] - Lookup a User
  /anime [(ex)tended] [anime title] - Lookup an Anime
  /manga [(ex)tended] [manga title] - Lookup a Manga
  /login [username] [password] - Login to Kitsu
  /kitsuhelp - Show this message`
  }
}
