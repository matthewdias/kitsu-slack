import Sequelize from 'sequelize'

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres'
})

const Team = sequelize.define('team', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  token: Sequelize.STRING
})

const User = sequelize.define('user', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  kitsuid: Sequelize.INTEGER,
  token: Sequelize.STRING,
  refresh: Sequelize.STRING
})

const setTeam = (id, token) => {
  return sequelize.sync().then(() => {
    Team.findCreateFind({
      where: { id },
      defaults: { token }
    })
  })
}

const getTeam = (id) => {
  return sequelize.sync().then(() => {
    return Team.findById(id)
  })
}

const setUser = (teamId, userId, defaults) => {
  console.log(teamId + '/' + userId)
  return sequelize.sync().then(() => {
    console.log(teamId + '/' + userId)
    return User.findCreateFind({
      where: { id: teamId + '/' + userId },
      defaults
    })
  }).then((users) => {
    let user = users[0]
    console.log(user)
    user.update(defaults)
  })
}

const getUser = (teamId, userId) => {
  return sequelize.sync().then(() => {
    return User.findById(teamId + '/' + userId)
  })
}

module.exports = { setTeam, getTeam, setUser, getUser }
