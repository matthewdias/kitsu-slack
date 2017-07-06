import OAuth2 from 'client-oauth2'
import JsonApi from 'devour-client'
const baseUrl = process.env.KITSU_HOST + '/api'

class Kitsu {
  constructor () {
    this.auth = new OAuth2({
      clientId: process.env.KITSU_CLIENT,
      clientSecret: process.env.KITSU_SECRET,
      accessTokenUri: baseUrl + '/oauth/token'
    })

    this.jsonApi = new JsonApi({ apiUrl: baseUrl + '/edge' })

    this.jsonApi.insertMiddlewareBefore('axios-request', {
      name: 'ignore-null-params',
      req: (payload) => {
        if (payload.req.params) {
          Object.entries(payload.req.params).forEach(([key, value]) => {
            if (!value) {
              delete payload.req.params[key]
            }
          })
        }
        return payload
      }
    })

    this.jsonApi.headers['User-Agent'] = 'Slack/1.0.0'

    this.jsonApi.define('user', {
      name: '',
      about: '',
      waifuOrHusbando: '',
      waifu: {
        jsonApi: 'hasOne',
        type: 'characters'
      },
      gender: '',
      location: '',
      birthday: '',
      createdAt: '',
      followersCount: '',
      followingCount: '',
      avatar: { medium: '' }
    })

    this.compactUserFields = ['name', 'about', 'avatar']
    this.userFields = [
      ...this.compactUserFields,
      'waifuOrHusbando',
      'gender',
      'location',
      'birthday',
      'createdAt',
      'followersCount',
      'followingCount',
      'waifu'
    ]

    this.jsonApi.define('character', {
      name: ''
    })

    this.characterFields = ['name']

    this.jsonApi.define('follow', {
      follower: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      followed: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    })

    this.compactMediaFields = ['canonicalTitle', 'slug', 'synopsis', 'posterImage']

    this.jsonApi.define('anime', {
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      popularityRank: '',
      posterImage: { large: '' },
      episodeCount: '',
      episodeLength: '',
      subtype: '',
      startDate: '',
      ageRating: '',
      ageRatingGuide: '',
      youtubeVideoId: '',
      categories: {
        jsonApi: 'hasMany',
        type: 'categories'
      }
    }, { collectionPath: 'anime' })

    this.animeFields = [
      ...this.compactMediaFields,
      'averageRating',
      'popularityRank',
      'episodeCount',
      'episodeLength',
      'subtype',
      'startDate',
      'ageRating',
      'ageRatingGuide',
      'youtubeVideoId',
      'categories'
    ]

    this.jsonApi.define('manga', {
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      popularityRank: '',
      posterImage: { large: '' },
      chapterCount: '',
      volumeCount: '',
      subtype: '',
      startDate: '',
      ageRating: '',
      ageRatingGuide: '',
      categories: {
        jsonApi: 'hasMany',
        type: 'categories'
      }
    }, { collectionPath: 'manga' })

    this.mangaFields = [
      ...this.compactMediaFields,
      'averageRating',
      'popularityRank',
      'chapterCount',
      'volumeCount',
      'subtype',
      'startDate',
      'ageRating',
      'ageRatingGuide',
      'categories'
    ]

    this.jsonApi.define('category', {
      title: ''
    })

    this.categoryFields = ['title']

    this.jsonApi.define('libraryEntry', {
      status: '',
      anime: {
        jsonApi: 'hasOne',
        type: 'anime'
      },
      manga: {
        jsonApi: 'hasOne',
        type: 'manga'
      },
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    }, { collectionPath: 'library-entries' })

    this.libraryEntryFields = ['status', 'anime', 'manga', 'user']

    this.jsonApi.define('post', {
      content: '',
      commentsCount: '',
      postLikesCount: '',
      spoiler: '',
      nsfw: '',
      createdAt: '',
      editedAt: '',
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      targetUser: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      targetGroup: {
        jsonApi: 'hasOne',
        type: 'groups'
      },
      media: {
        jsonApi: 'hasOne'
      }
    })

    this.compactPostFields = ['user', 'nsfw', 'spoiler', 'targetGroup']
    this.postFields = [
      ...this.compactPostFields,
      'content',
      'commentsCount',
      'postLikesCount',
      'spoiler',
      'nsfw',
      'createdAt',
      'editedAt',
      'targetUser',
      'media'
    ]

    this.jsonApi.define('postLike', {
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      post: {
        jsonApi: 'hasOne',
        type: 'posts'
      }
    }, { collectionPath: 'post-likes' })

    this.jsonApi.define('comment', {
      content: '',
      repliesCount: '',
      likesCount: '',
      createdAt: '',
      editedAt: '',
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      post: {
        jsonApi: 'hasOne',
        type: 'posts'
      }
    })

    this.commentFields = [
      'content',
      'repliesCount',
      'likesCount',
      'createdAt',
      'editedAt',
      'user',
      'post'
    ]

    this.jsonApi.define('commentLike', {
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      comment: {
        jsonApi: 'hasOne',
        type: 'comments'
      }
    }, { collectionPath: 'comment-likes' })

    this.jsonApi.define('group', {
      slug: '',
      about: '',
      name: '',
      membersCount: '',
      nsfw: '',
      privacy: '',
      avatar: { medium: '' },
      category: {
        jsonApi: 'hasOne',
        type: 'groupCategories'
      }
    })

    this.compactGroupFields = ['name', 'about', 'slug', 'avatar', 'nsfw']
    this.groupFields = [
      ...this.compactGroupFields,
      'membersCount',
      'privacy',
      'category'
    ]

    this.jsonApi.define('groupCategory', {
      name: ''
    })

    this.groupCategoryFields = ['name']

    this.jsonApi.define('groupMember', {
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      group: {
        jsonApi: 'hasOne',
        type: 'groups'
      }
    }, { collectionPath: 'group-members' })

    this.jsonApi.define('review', {
      content: '',
      likesCount: '',
      rating: '',
      spoiler: '',
      createdAt: '',
      media: {
        jsonApi: 'hasOne'
      },
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    })

    this.reviewFields = [
      'content',
      'likesCount',
      'rating',
      'spoiler',
      'createdAt',
      'media',
      'user'
    ]
  }

  authenticate (token) {
    this.jsonApi.headers['Authorization'] = `Bearer ${token}`
  }

  unauthenticate () {
    delete this.jsonApi.headers['Authorization']
  }

  login (username, password) {
    return this.auth.owner.getToken(username, password)
  }

  refresh (token, refresh) {
    let authToken = this.auth.createToken(token, refresh)
    return authToken.refresh()
  }

  // users
  getUserId (name) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { name },
        page: { limit: 1 },
        fields: { users: ['name'].join() }
      }).then((users) => {
        resolve(users[0].id)
      })
    })
  }

  getUser (id, extended) {
    return this.jsonApi.find('user', id, {
      include: extended ? 'waifu' : null,
      fields: {
        users: extended ? this.userFields.join() : this.compactUserFields.join(),
        characters: this.characterFields.join()
      }
    })
  }

  findUser (name, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { name },
        include: extended ? 'waifu' : null,
        page: { limit: 1 },
        fields: {
          users: extended ? this.userFields.join() : this.compactUserFields.join(),
          characters: this.characterFields.join()
        }
      }).then((users) => {
        resolve(users[0])
      })
    })
  }

  searchUsers (query, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { query },
        include: extended ? 'waifu' : null,
        page: { limit: 1 },
        fields: {
          users: extended ? this.userFields.join() : this.compactUserFields.join(),
          characters: this.characterFields.join()
        }
      }).then((users) => {
        resolve(users[0])
      })
    })
  }

  // anime
  findAnime (slug, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('anime', {
        filter: { slug },
        include: extended ? 'categories' : null,
        page: { limit: 1 },
        fields: {
          anime: extended ? this.animeFields.join() : this.compactMediaFields.join(),
          categories: this.categoryFields.join()
        }
      }).then((anime) => {
        resolve(anime[0])
      })
    })
  }

  searchAnime (text, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('anime', {
        filter: { text },
        include: extended ? 'categories' : null,
        page: { limit: 1 },
        fields: {
          anime: extended ? this.animeFields.join() : this.compactMediaFields.join(),
          categories: this.categoryFields.join()
        }
      }).then((anime) => {
        resolve(anime[0])
      })
    })
  }

  // manga
  findManga (slug, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('manga', {
        filter: { slug },
        include: extended ? 'categories' : null,
        page: { limit: 1 },
        fields: {
          manga: extended ? this.mangaFields.join() : this.compactMediaFields.join(),
          categories: this.categoryFields.join()
        }
      }).then((manga) => {
        resolve(manga[0])
      })
    })
  }

  searchManga (text, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('manga', {
        filter: { text },
        include: extended ? 'categories' : null,
        page: { limit: 1 },
        fields: {
          manga: extended ? this.mangaFields.join() : this.compactMediaFields.join(),
          categories: this.categoryFields.join()
        }
      }).then((manga) => {
        resolve(manga[0])
      })
    })
  }

  // groups
  findGroup (slug, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('group', {
        filter: { slug },
        include: extended ? 'category' : null,
        page: { limit: 1 },
        fields: {
          groups: extended ? this.groupFields.join() : this.compactGroupFields.join(),
          groupCategories: this.groupCategoryFields.join()
        }
      }).then((groups) => {
        resolve(groups[0])
      })
    })
  }

  searchGroups (query, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('group', {
        filter: { query },
        include: extended ? 'category' : null,
        page: { limit: 1 },
        fields: {
          groups: extended ? this.groupFields.join() : this.compactGroupFields.join(),
          groupCategories: this.groupCategoryFields.join()
        }
      }).then((groups) => {
        resolve(groups[0])
      })
    })
  }

  // posts
  getPost (id) {
    return this.jsonApi.find('post', id, {
      include: 'user,targetUser,targetGroup,media',
      fields: {
        posts: this.postFields.join(),
        users: this.compactUserFields.join(),
        groups: this.groupFields.join(),
        anime: this.compactMediaFields.join(),
        manga: this.compactMediaFields.join()
      }
    })
  }

  // comments
  getComment (id) {
    return this.jsonApi.find('comment', id, {
      include: 'user,post.user,post.targetGroup',
      fields: {
        comments: this.commentFields.join(),
        users: this.compactUserFields.join(),
        posts: this.compactPostFields.join(),
        groups: this.compactGroupFields.join()
      }
    })
  }

  // reviews
  getReview (id) {
    return this.jsonApi.find('review', id, {
      include: 'user,media',
      fields: {
        reviews: this.reviewFields.join(),
        users: this.compactUserFields.join(),
        anime: this.compactMediaFields.join(),
        manga: this.compactMediaFields.join()
      }
    })
  }

  // actions
  searchFollows (follower, followed) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('follow', {
        filter: { follower, followed }
      }).then((follows) => {
        resolve(follows[0])
      })
    })
  }

  createFollow (follow) {
    return this.jsonApi.create('follow', follow)
  }

  removeFollow (id) {
    return this.jsonApi.destroy('follow', id)
  }

  searchGroupMembers (user, group) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('groupMember', {
        filter: { user, group },
        fields: { groupMembers: 'id' }
      }).then((groupMembers) => {
        resolve(groupMembers[0])
      })
    })
  }

  createGroupMember (groupMember) {
    return this.jsonApi.create('groupMember', groupMember)
  }

  removeGroupMember (id) {
    return this.jsonApi.destroy('groupMember', id)
  }

  searchPostLikes (userId, postId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('postLike', {
        filter: { userId, postId }
      }).then((postLikes) => {
        resolve(postLikes[0])
      })
    })
  }

  createPostLike (postLike) {
    return this.jsonApi.create('postLike', postLike)
  }

  removePostLike (id) {
    return this.jsonApi.destroy('postLike', id)
  }

  searchCommentLikes (userId, commentId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('commentLike', {
        filter: { userId, commentId }
      }).then((commentLikes) => {
        resolve(commentLikes[0])
      })
    })
  }

  createCommentLike (commentLike) {
    return this.jsonApi.create('commentLike', commentLike)
  }

  removeCommentLike (id) {
    return this.jsonApi.destroy('commentLike', id)
  }

  createEntry (entry) {
    return this.jsonApi.create('libraryEntry', entry)
  }

  getEntry (id) {
    return this.jsonApi.find('libraryEntry', id)
  }

  getEntryForAnime (userId, animeId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: { userId, animeId },
        fields: { libraryEntries: this.libraryEntryFields.join() }
      }).then((entries) => {
        resolve(entries[0])
      })
    })
  }

  getEntryForManga (userId, mangaId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: { userId, mangaId },
        fields: { libraryEntries: this.libraryEntryFields.join() }
      }).then((entries) => {
        resolve(entries[0])
      })
    })
  }

  updateEntry (entry) {
    return this.jsonApi.update('libraryEntry', entry)
  }

  removeEntry (id) {
    return this.jsonApi.destroy('libraryEntry', id)
  }
}

module.exports = Kitsu
