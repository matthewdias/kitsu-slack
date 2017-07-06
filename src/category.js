import moment from 'moment'

export function categoryAttachment (category) {
  let {
    title,
    slug,
    description,
    nsfw,
    image
  } = category

  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/explore/anime/category/' + slug
  let fallback = title + ' - ' + title_link

  if (!nsfw && description) {
    text += description
    fallback += `\n${description}`
  }

  if (nsfw) {
    fields.push({
      value: ':smirk: `NSFW`',
      short: true
    })
    fallback += '\n[NSFW]'
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text', 'fields'],
    callback_id: category.id,
    title,
    title_link,
    text,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix()
    // actions: [{
    //   name: 'category',
    //   text: 'Favorite/Unfavorite',
    //   type: 'button'
    // }]
  }

  let categoryImage = image ? image.medium : null
  if (categoryImage) {
    attachment.image_url = categoryImage
  }

  return attachment
}
