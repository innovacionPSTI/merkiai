# infra/kms-vault — AWS KMS para el EnvelopeVault (HU-362 · ADR-007)

Stack **AWS CDK** standalone (fuera del workspace pnpm). Crea, **por entorno**, la
KEK y el usuario IAM de alcance mínimo que el **console** usa para cifrar/descifrar
los secretos del vault (ADR-007 §4.1). Una KEK por entorno → aislamiento: una llave
de no-prod no descifra secretos de prod.

## Qué crea (por entorno)

- **`kms.Key`** con rotación automática anual, alias `alias/merkiai-<env>-tenant-secrets`.
  En `prod` la llave se **retiene** si se borra el stack (no perder acceso a lo cifrado).
- **Usuario IAM** `merkiai-<env>-vault` con permisos **solo** sobre esa KEK:
  `kms:GenerateDataKey`, `kms:Decrypt`, `kms:Encrypt`, `kms:DescribeKey` — nada de `kms:*`
  ni `Resource:*`, ni administración de la llave.
- **Outputs** (no secretos): ARN de la KEK, alias y nombre del usuario IAM.

**No** crea access keys en el template (no deja secretos en CloudFormation). Se generan
una vez a mano y se cargan en las env del console (abajo).

## Requisitos

- Node 20+, AWS CLI configurado con el **perfil/cuenta del entorno** (prod en su cuenta).
- `cd infra/kms-vault && npm install`
- Bootstrap de CDK una vez por cuenta/región: `npx cdk bootstrap`

## Desplegar

```bash
# usa el perfil AWS del entorno (p. ej. AWS_PROFILE=merkiai-test)
npm install
npx cdk deploy -c env=test
# prod en la cuenta/perfil de producción:
AWS_PROFILE=merkiai-prod npx cdk deploy -c env=prod
```

## Crear la credencial del console (una vez por entorno)

```bash
aws iam create-access-key --user-name merkiai-<env>-vault
```

Carga el `AccessKeyId` y `SecretAccessKey` en las **env del console en Vercel** (Environment
del entorno correspondiente), junto con la región:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=<región de la KEK>
MERKIAI_VAULT_KEY_ALIAS=alias/merkiai-<env>-tenant-secrets
```

> Estas llaves son el **root of trust** del vault: viven SOLO en la env del console
> (no en el repo, no en el propio vault). Rótalas con `aws iam create-access-key` +
> actualizar Vercel + `delete-access-key` de la vieja (cadencia HU-228).

## Verificar sin desplegar

```bash
npm install
npx cdk synth -c env=test    # genera el CloudFormation y valida el stack
```
