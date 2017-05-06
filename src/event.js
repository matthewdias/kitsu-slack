import { WebClient } from '@slack/client'
import { getTeam } from './db'
import { userAttachment } from './user'

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
  console.log('event: ' + 'link_shared: ' + links.map(link => link.url).join())

  let { token } = await getTeam(team_id)
  let slack = new WebClient(token)

  await Promise.all(links.map(async (link) => {
    let { url } = link
    let unfurl

    const mediaRoute = async (path, match) => {
      let mediaKind = match
      await route(path, /\/[a-z0-9_-]+/, async (path, match) => {
        if (mediaKind === 'anime') {
          await route(path, /\/episodes/, async (path, match) => {
            unfurl = { text: mediaKind + '/episodes' }
          })
        }
        if (mediaKind === 'manga') {
          await route(path, /\/chapters/, async (path, match) => {
            unfurl = { text: mediaKind + '/chapters' }
          })
        }
        await route(path, /\/characters/, async (path, match) => {
          unfurl = { text: mediaKind + '/characters' }
        })
        await route(path, /\/reviews/, async (path, match) => {
          unfurl = { text: mediaKind + '/reviews' }
        })
        await route(path, /\/quotes/, async (path, match) => {
          unfurl = { text: mediaKind + '/quotes' }
        })
        if (!unfurl) {
          unfurl = { text: mediaKind + '/show' }
        }
      })
      if (!unfurl) {
        unfurl = { text: mediaKind + '/index' }
      }
    }

    await route(url, /\/anime/, mediaRoute)
    await route(url, /\/manga/, mediaRoute)

    await route(url, /\/trending/, async (path, match) => {
      unfurl = { text: 'trending' }
    })

    await route(url, /\/users/, async (path, match) => {
      await route(path, /\/[a-zA-Z0-9_]+/, async (path, match) => {
        await route(path, /\/library/, async (path, match) => {
          unfurl = { text: 'users/library' }
        })
        await route(path, /\/reviews/, async (path, match) => {
          unfurl = { text: 'users/reviews' }
        })
        if (!unfurl) {
          let user = await kitsu.findUser(match)
          unfurl = userAttachment(user)
        }
      })
    })

    await route(url, /\/posts/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        unfurl = { text: 'posts/show' }
      })
    })

    await route(url, /\/comments/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        unfurl = { text: 'comments/show' }
      })
    })

    await route(url, /\/groups/, async (path, match) => {
      await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
        await route(path, /\/rules/, async (path, match) => {
          unfurl = { text: 'groups/rules' }
        })
        await route(path, /\/members/, async (path, match) => {
          unfurl = { text: 'groups/members' }
        })
        await route(path, /\/leaders/, async (path, match) => {
          unfurl = { text: 'groups/leaders' }
        })
        if (!unfurl) {
          unfurl = { text: 'groups/show' }
        }
      })
      if (!unfurl) {
        unfurl = { text: 'groups/index' }
      }
    })

    await route(url, /\/reviews/, async (path, match) => {
      await route(path, /\/\d+/, async (path, match) => {
        unfurl = { text: 'reviews/show' }
      })
    })

    await route(url, /\/feedback/, async (path, match) => {
      await route(path, /\/bugs/, async (path, match) => {
        await route(path, /\/p/, async (path, match) => {
          await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
            unfurl = { text: 'feedback/bugs/show' }
          })
        })
        if (!unfurl) {
          unfurl = { text: 'feedback/bugs/index' }
        }
      })
      await route(path, /\/feature-requests/, async (path, match) => {
        await route(path, /\/p/, async (path, match) => {
          await route(path, /\/[a-zA-Z0-9_-]+/, async (path, match) => {
            unfurl = { text: 'feedback/feature-requests/show' }
          })
        })
        if (!unfurl) {
          unfurl = { text: 'feedback/feature-requests/index' }
        }
      })
      if (!unfurl) {
        unfurl = { text: 'feedback/index' }
      }
    })

    await route(url, /\/privacy/, async (path, match) => {
      unfurl = { text: 'privacy' }
    })

    await route(url, /\/terms/, async (path, match) => {
      unfurl = { text: 'terms' }
    })

    await route(url, /\/about/, async (path, match) => {
      unfurl = { text: 'about' }
    })

    if (!unfurl) {
      unfurl = { text: 'kitsu' }
    }

    await slack.chat.unfurl(message_ts, channel, {
      [url]: unfurl
    }).catch((err) => { throw new Error(err) })
  }))
}
