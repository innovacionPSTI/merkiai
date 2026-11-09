import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'

/**
 * HU-362 · ADR-007 — Stack de custodia de secretos (AWS KMS) para Merkiai.
 *
 * Crea, POR ENTORNO (test/dev/prod), una KEK con rotación anual y un usuario IAM
 * de **alcance mínimo** que el console (control plane) usa para el cifrado de
 * sobre del EnvelopeVault. Una KEK por entorno → una llave de no-prod no descifra
 * secretos de prod.
 *
 * Intencionalmente NO crea access keys del usuario IAM en el template (no deja
 * secretos en CloudFormation): se generan una vez a mano y se cargan en las env
 * del console en Vercel (ver README). El usuario IAM queda listo y sin permisos
 * de más.
 */
export interface KmsVaultStackProps extends StackProps {
  /** Nombre del entorno: 'test' | 'dev' | 'prod'. Determina alias y nombres. */
  envName: string
}

export class KmsVaultStack extends Stack {
  constructor(scope: Construct, id: string, props: KmsVaultStackProps) {
    super(scope, id, props)
    const { envName } = props

    // ── KEK (Key Encryption Key) por entorno ──────────────────────────────────
    const key = new kms.Key(this, 'TenantSecretsKey', {
      alias: `alias/merkiai-${envName}-tenant-secrets`,
      description: `Merkiai ${envName} · KEK para el EnvelopeVault (HU-362/ADR-007)`,
      enableKeyRotation: true, // rotación automática anual de la KEK
      rotationPeriod: Duration.days(365),
      // prod: conserva la llave si se borra el stack (evita perder acceso a los
      // secretos cifrados). No-prod: permite limpieza.
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    // ── Usuario IAM de alcance mínimo (lo consume SOLO el console) ─────────────
    const user = new iam.User(this, 'VaultUser', {
      userName: `merkiai-${envName}-vault`,
    })

    // Permisos mínimos: cifrado de sobre sobre ESTA KEK, nada más. `grant` añade
    // la acción tanto a la política del usuario como a la key policy del recurso.
    key.grant(
      user,
      'kms:GenerateDataKey', // crea la DEK por secreto
      'kms:Decrypt',         // descifra la DEK para leer
      'kms:Encrypt',         // cifra directo (valores cortos)
      'kms:DescribeKey',     // metadata
    )

    // ── Salidas (no secretas) ────────────────────────────────────────────────
    new CfnOutput(this, 'KeyArn', { value: key.keyArn, description: 'ARN de la KEK (para referencia; el console usa el alias)' })
    new CfnOutput(this, 'KeyAlias', { value: `alias/merkiai-${envName}-tenant-secrets`, description: 'Alias de la KEK' })
    new CfnOutput(this, 'VaultUserName', { value: user.userName, description: 'Usuario IAM; crear su access key a mano (ver README)' })
  }
}
