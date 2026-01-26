// This file must be imported FIRST before any other imports that use process.env
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env from BACKEND directory
const envPath = resolve(__dirname, '../.env')
dotenv.config({ path: envPath })
