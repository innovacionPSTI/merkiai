#!/usr/bin/env node
import { App } from 'aws-cdk-lib'
import { KmsVaultStack } from '../lib/kms-vault-stack'

/**
 * Un stack por entorno. El entorno se elige con `-c env=test|dev|prod` (context).
 * Cada uno despliega su propia KEK + usuario IAM, idealmente en la cuenta AWS de
 * ese entorno (prod aparte de no-prod).
 *
 *   cdk deploy -c env=test
 *   cdk deploy -c env=prod   # en la cuenta/perfil AWS de producción
 */
const app = new App()
const envName = (app.node.tryGetContext('env') as string | undefined) ?? 'dev'

if (!['test', 'dev', 'prod'].includes(envName)) {
  throw new Error(`env inválido: "${envName}". Usa -c env=test|dev|prod`)
}

new KmsVaultStack(app, `MerkiaiKmsVault-${envName}`, {
  envName,
  // La cuenta/región salen del perfil AWS activo (CDK_DEFAULT_*). Para prod,
  // usa el perfil/cuenta de producción (aislamiento por cuenta, ADR-007).
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: `Merkiai KMS vault (${envName}) · HU-362/ADR-007`,
})
