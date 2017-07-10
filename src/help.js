export default async (ctx, next) => {
  ctx.status = 200
  ctx.body = {
    response_type: 'ephemeral',
    text:
`This app lets you retrieve information from Kitsu. You can search users, anime, manga, and groups in the default compact mode, or in extended mode. It also supports unfurling Kitsu links into rich previews. By logging in with your Kitsu credentials via \`/login\`, you can enable additional features, specifically following users and adding/editing media. If you don't have an account, head over to ${process.env.KITSU_HOST} to get started.

Commands:

\`\`\`
/user [(ex)tended] [username] - Lookup a User
/user [(ex)tended] [@username] - Lookup by Slack name
/anime [(ex)tended] [anime title] - Lookup an Anime
/manga [(ex)tended] [manga title] - Lookup a Manga
/group [(ex)tended] [group name] - Lookup a Group
/login [username] [password] - Login to Kitsu
/logout - Logout of Kitsu
/kitsuhelp - Show this message
\`\`\`

Privacy Policy:

Your Kitsu credentials are not stored. They are exchanged for a key which is stored in a private database to make authenticated requests to the Kitsu API on your behalf.

Go to https://kitsu-slack.herokuapp.com/contact.html for support.`
  }
}
