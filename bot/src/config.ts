import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  RPC_URL: z.string().default("https://base-sepolia-public.nodies.app"),
  CHAIN_ID: z.coerce.number().default(84532),
  BET_FACTORY_ADDRESS: z.string().default("0x65F971b490c9f5afcE465b9eEfCEFC91d25483c6"),
  WEBAPP_URL: z.string().default("https://betsys.example.com"),
  OPERATOR_PRIVATE_KEY: z.string().min(1),
  BASESCAN_API_KEY: z.string().default(""),
  CONTRACTS_PATH: z.string().default("../contracts"),
})

export const config = envSchema.parse(process.env)
