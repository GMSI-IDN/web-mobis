import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, defaultLoggerOptions, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL, getAllowedOrigins } from './utilities/getURL'

import { CustomerCollections } from './collections/Customers'
import { VoucherPromoCollections } from './collections/VoucherPromo'
import { MobisWidgetsGlobal } from './components/MobisWidget/payload/MobisWidgets.global'
import { resyncPostgresSequencesOnInit } from './lib/db/resyncPostgresSequences'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const dbPushEnabled = process.env.PAYLOAD_DB_PUSH === 'true'
const enableCustomAdmin = process.env.PAYLOAD_ENABLE_CUSTOM_ADMIN !== 'false'

export default buildConfig({
  serverURL: getServerSideURL(),

  routes: {
    api: '/api',
    admin: '/admin',
  },

  admin: {
    components: enableCustomAdmin
      ? {
          beforeLogin: ['@/components/BeforeLogin'],
          beforeNavLinks: ['@/components/AdminNav/ReportsNavLink'],
          views: {
            dashboard: {
              Component: '@/components/Dashboard',
            },
            reports: {
              Component: '@/components/Reports',
              path: '/reports',
            },
          },
        }
      : {},
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },

  editor: defaultLexical,

  db: postgresAdapter({
    push: dbPushEnabled,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    ...CustomerCollections,
    ...VoucherPromoCollections,
  ],

  cors: getAllowedOrigins(),
  csrf: getAllowedOrigins(),

  globals: [Header, Footer, MobisWidgetsGlobal],

  plugins,

  secret: process.env.PAYLOAD_SECRET,

  // Payload logs a hard ERROR for every request to a media file that is missing
  // from disk (payload/uploads/endpoints/getFile.ts). It returns a 500 rather than
  // throwing, so it is noise rather than a fault — but it fires once per request
  // per image, which buries genuine errors in the log.
  //
  // Downgrade only that message to debug (hidden at the default `info` level,
  // visible again with PAYLOAD_LOG_LEVEL=debug). Everything else is untouched.
  logger: {
    options: {
      name: 'payload',
      level: process.env.PAYLOAD_LOG_LEVEL || 'info',
      hooks: {
        logMethod(args, method, level) {
          const [first] = args

          // 50 = error. The level guard is also what stops this hook recursing
          // when we re-emit the same message at debug below.
          if (level >= 50 && typeof first === 'string' && first.includes('is missing on the disk')) {
            this.debug(...args)
            return
          }

          return method.apply(this, args)
        },
      },
    },
    destination: defaultLoggerOptions,
  },

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },

  onInit: async (payload) => {
    await resyncPostgresSequencesOnInit(payload)
  },
})
