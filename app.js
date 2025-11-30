import sessionInDatabase from 'connect-pg-simple'
import express from 'express'
import session from 'express-session'
import NHSPrototypeKit from 'nhsuk-prototype-kit'
import { Pool } from 'pg'

import sessionDataDefaults from './app/data.js'
import filters from './app/filters.js'
import globals from './app/globals.js'
import routes from './app/routes.js'

const { DATABASE_URL, NODE_ENV } = process.env

const app = express()

const prototype = await NHSPrototypeKit.init({
  app,
  buildOptions: {
    entryPoints: [
      'app/assets/stylesheets/*.scss',
      'app/assets/javascripts/*.js'
    ]
  },
  filters,
  routes,
  serviceName: 'Manage vaccinations in schools',
  ...(DATABASE_URL && {
    session: session({
      cookie: {
        maxAge: 1000 * 60 * 60 * 4, // 4 hours
        secure: process.env.NODE_ENV === 'production'
      },
      resave: false,
      saveUninitialized: false,
      secret: 'manage-vaccinations-in-schools-prototype',
      store: new (sessionInDatabase(session))({
        pool: new Pool({
          connectionString: DATABASE_URL,
          ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        })
      })
    })
  }),
  sessionDataDefaults,
  viewsPath: ['app', 'app/views', 'node_modules/nhsuk-decorated-components']
})

prototype.app.set('view engine', 'njk')

for (const [key, value] of Object.entries(globals())) {
  prototype.nunjucks?.addGlobal(key, value)
}

prototype.start()
