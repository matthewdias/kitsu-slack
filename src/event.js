import { WebClient } from '@slack/client'
import { getUser, getTeam } from './db'
import { animeAttachment } from './anime'
import { mangaAttachment } from './manga'
import { categoryAttachment } from './category'
import { userAttachment } from './user'
import { postAttachment } from './post'
import { commentAttachment } from './comment'
import { reviewAttachment } from './review'
import { feedbackAttachment, getFeedback } from './feedback'
import { pageAttachment } from './page'
import { groupAttachment } from './group'

const route = async (path, route, children) => {
  let match = route.exec(path)
  if (match) {
    let p = path.slice(match.index).replace(route, '')
    let m = match[0].replace(/^\/+|\/+$/g, '')
    await children(p, m)
  }
}

export default async (ctx, next, kitsu) => {
  let { type, challenge } = ctx.request.body
  if (type === 'url_verification') {
    ctx.body = challenge
    return
  }
  let { team_id, event } = ctx.request.body
  let { channel, message_ts, links } = event
  let sender = event.user
  console.log('event: ' + 'link_shared: ' + links.map(link => link.url).join())

  let { token } = await getTeam(team_id)
  let slack = new WebClient(token)

  await Promise.all(links.map(async (link) => {
    let { url } = link
    let unfurl

    await route(url, /\/explore\/anime|manga/, async (path, match) => {
      await route(path, /\/category/, async (path, match) => {
        await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
          let { token, fresh } = await kitsu.authUser(team_id, sender, ctx, kitsu)
          if (fresh) {
            kitsu.authenticate(token)
          }
          let category = await kitsu.findCategory(match)
          unfurl = categoryAttachment(category)
          kitsu.unauthenticate()
        })
      })
      if (!unfurl) {
        unfurl = pageAttachment(match)
      }
    })

    const mediaRoute = async (path, match) => {
      let mediaKind = match
      await route(path, /\/[a-z0-9_-]+/, async (path, match) => {
        let { token, fresh } = await kitsu.authUser(team_id, sender, ctx, kitsu)
        if (fresh) {
          kitsu.authenticate(token)
        }
        if (mediaKind === 'anime') {
          let anime = await kitsu.findAnime(match)
          unfurl = animeAttachment(anime)
        } else if (mediaKind === 'manga') {
          let manga = await kitsu.findManga(match)
          unfurl = mangaAttachment(manga)
        }
        kitsu.unauthenticate()
      })
      if (!unfurl) {
        unfurl = pageAttachment(match)
      }
    }

    if (!unfurl) {
      await route(url, /\/anime/, mediaRoute)
      await route(url, /\/manga/, mediaRoute)
    }

    await route(url, /\/users/, async (path, match) => {
      await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
        // await route(path, /\/library/, async (path, match) => {
        //   unfurl = { text: 'users/library' }
        // })
        if (!unfurl) {
          let user = await kitsu.findUser(match)
          unfurl = userAttachment(user)
        }
      })
    })

    await route(url, /\/posts/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        let { token, fresh } = await kitsu.authUser(team_id, sender, ctx, kitsu)
        if (fresh) {
          kitsu.authenticate(token)
        }
        let post = await kitsu.getPost(match)
        unfurl = postAttachment(post)
        kitsu.unauthenticate()
      })
    })

    await route(url, /\/comments/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        let { token, fresh } = await kitsu.authUser(team_id, sender, ctx, kitsu)
        if (fresh) {
          kitsu.authenticate(token)
        }
        let comment = await kitsu.getComment(match)
        unfurl = commentAttachment(comment)
        kitsu.unauthenticate()
      })
    })

    await route(url, /\/groups/, async (path, match) => {
      await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
        let { token, fresh } = await kitsu.authUser(team_id, sender, ctx, kitsu)
        if (fresh) {
          kitsu.authenticate(token)
        }
        let group = await kitsu.findGroup(match)
        unfurl = groupAttachment(group)
        kitsu.unauthenticate()
      })
      if (!unfurl) {
        unfurl = pageAttachment(match)
      }
    })

    await route(url, /\/reviews/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        let review = await kitsu.getReview(match)
        unfurl = reviewAttachment(review)
      })
    })

    const boardRoute = async (path, match) => {
      let feedbackKind = match
      await route(path, /\/p/, async (path, match) => {
        await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
          let feedback = await getFeedback(match, feedbackKind)
          unfurl = feedbackAttachment(feedback)
        })
      })
      if (!unfurl) {
        unfurl = pageAttachment(match)
      }
    }

    const feedbackRoute = async (path, match) => {
      await route(path, /\/bugs/, boardRoute)
      await route(path, /\/feature-requests/, boardRoute)
      if (!unfurl) {
        unfurl = pageAttachment(match)
      }
    }

    await route(url, /\/feedback/, feedbackRoute)

    await feedbackRoute(url)

    if (!unfurl) {
      await route(url, /\/trending/, async (path, match) => {
        unfurl = pageAttachment(match)
      })
    }

    await route(url, /\/privacy/, async (path, match) => {
      unfurl = pageAttachment(match)
    })

    await route(url, /\/terms/, async (path, match) => {
      unfurl = pageAttachment(match)
    })

    await route(url, /\/about/, async (path, match) => {
      unfurl = pageAttachment(match)
    })

    if (!unfurl) {
      unfurl = pageAttachment('')
    }

    await slack.chat.unfurl(message_ts, channel, {
      [url]: unfurl
    }).catch((err) => { throw new Error(err) })
  }))
}
