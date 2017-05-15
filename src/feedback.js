import moment from 'moment'
import CDP from 'chrome-remote-interface'

const CANNY_HOST = 'https://kitsu.canny.io/'

export function feedbackAttachment (feedback, extended) {
  let {
    slug,
    board,
    title,
    votes,
    status,
    avatar,
    user,
    content,
    date,
    comments
  } = feedback

  let text = ''
  let fields = []
  let title_link = `${CANNY_HOST}${board}/p/${slug}`
  let type = board === 'bugs' ? 'Bug' : 'Feature Request'
  title = `${type} - ${title}`
  let fallback = title + ' - ' + title_link

  if (content) {
    text += content
    fallback += `\n${content}`
  }

  if (votes) {
    fields.push({
      title: ':arrow_up_small: Votes',
      value: votes,
      short: true
    })
    fallback += `\nVotes: ${votes}`
  }

  if (comments) {
    fields.push({
      title: ':speech_balloon: Comments',
      value: comments,
      short: true
    })
    fallback += `\nComments: ${comments}`
  }

  if (status) {
    status = status.charAt(0).toUpperCase() + status.slice(1)
    fields.push({
      title: ':spiral_note_pad: Status',
      value: status,
      short: true
    })
    fallback += `\nStatus: ${status}`
  }

  if (date) {
    let d = moment.utc(date, 'MMMM DD, YYYY')
    date = d.isValid() ? d.fromNow() : date
    fields.push({
      title: ':clock3: Posted',
      value: date,
      short: true
    })
    fallback += `\nPosted: ${date}`
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text'],
    callback_id: slug,
    title,
    title_link,
    text,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix()
  }

  if (user) {
    attachment.author_name = user
  }

  if (avatar) {
    attachment.author_icon = avatar
  }

  return attachment
}

const query = async (Runtime, selector, after, all) => {
  let expression =
    `document.querySelector${all ? 'All' : ''}('${selector}')${after}`
  let { result } = await Runtime.evaluate({ expression })
  if (result.value) {
    return result.value
  }
}

export async function getFeedback (slug, board) {
  let url = `${CANNY_HOST}${board}/p/${slug}`
  try {
    let manager = await CDP({ tab: 'ws://localhost:9222/devtools/browser' })
    let { targetId } = await manager.Target.createTarget({ url })
    let list = await CDP.List()
    let tab = list.find(target => target.id === targetId).webSocketDebuggerUrl
    let { Page, Runtime } = await CDP({ tab })
    await Page.enable()
    await Page.loadEventFired()

    let post = {
      slug,
      board,
      title: await query(Runtime, '.postTitle', '.innerHTML'),
      votes: await query(Runtime, '.postVotes > span', '.innerHTML'),
      status: await query(Runtime, '.postStatus', '.innerHTML')
        .then(status => status.replace(/&nbsp;/g, ' '))
        .catch(e => null),
      avatar: await query(Runtime, '.postAuthor > div > div > .userAvatarContainer > div > div > img', '.src'),
      user: await query(Runtime, '.postAuthor > div > div > .userInfo > span', '.innerHTML'),
      content: await query(Runtime, '.postBody > span > span', '.innerHTML')
        .then((content) => content
          .replace(/<([a-z]*)\b[^>]*>/g, '')
          .replace(/<\/?([a-z]*)\b[^>]*>/g, '\n').trim()
        ).catch(e => null),
      date: await query(Runtime, '.postMenu > a > div', '.innerHTML')
        .then(date => date.replace(/&nbsp;/g, ' '))
        .catch(e => null),
      comments: await query(Runtime, '.comment', '.length', true)
    }

    manager.Target.closeTarget({ targetId })
    return post
  } catch (e) {
    console.log(e)
  }
}
