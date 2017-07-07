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
    ts: moment().unix(),
    actions: [{
      name: 'category',
      text: 'Favorite/Unfavorite',
      type: 'button'
    }]
  }

  let categoryImage = image ? image.medium : null
  if (categoryImage) {
    attachment.image_url = categoryImage
  }

  return attachment
}

export async function categoryAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'category') {
    let categoryFavorite = await kitsu.searchCategoryFavorites(kitsuid, callback_id)
    if (categoryFavorite) {
      body.attachments[0].callback_id = categoryFavorite.id
      body.attachments[0].title = 'Unfavorite ' + title
      body.attachments[0].actions = [
        {
          name: 'categoryfavorite',
          text: 'Unfavorite',
          style: 'danger',
          type: 'button',
          value: 'unfavorite',
          confirm: {
            title: 'Unfavorite ' + title,
            text: `Are you sure you want to unfavorite ${title}?`
          }
        }
      ]
    } else {
      body.attachments[0].title = 'Favorite ' + title
      body.attachments[0].actions = [
        {
          name: 'categoryfavorite',
          text: 'Favorite',
          style: 'primary',
          type: 'button',
          value: 'favorite',
          confirm: {
            title: 'Favorite ' + title,
            text: `Are you sure you want to favorite ${title}?`
          }
        }
      ]
    }
    ctx.body = body
    return true
  }

  if (action.name === 'categoryfavorite') {
    if (action.value === 'unfavorite') {
      kitsu.authenticate(token)
      try {
        await kitsu.removeCategoryFavorite(callback_id)
        body.text = 'Unfavorited.'
      } catch (error) {
        body.text = 'Not yet favorited.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }

    if (action.value === 'favorite') {
      kitsu.authenticate(token)
      try {
        await kitsu.createCategoryFavorite({
          user: { id: kitsuid },
          category: { id: callback_id }
        })
        body.text = 'Favorited.'
      } catch (error) {
        body.text = 'Already favorited.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }
  }
  return false
}
