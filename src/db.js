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

const setTeam = async (id, token) => {
  await sequelize.sync()
  return Team.upsert({ id, token })
}

const getTeam = async (id) => {
  await sequelize.sync()
  return Team.findById(id)
}

const setUser = async (teamId, userId, auth) => {
  await sequelize.sync()
  return User.upsert({
    id: teamId + '/' + userId,
    ...auth
  })[0]
}

const getUser = async (teamId, userId) => {
  await sequelize.sync()
  return User.findById(teamId + '/' + userId)
}

module.exports = { setTeam, getTeam, setUser, getUser }
