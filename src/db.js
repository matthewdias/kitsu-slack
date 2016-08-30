import Sequelize from 'sequelize'

if (process.env.DATABASE_URL) {
  var sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres'
  })
} else {
  sequelize = new Sequelize('localhb', 'Matthew', null, {
    host: 'localhost',
    dialect: 'postgres',
    protocol: 'postgres'
  })
}

export default sequelize
