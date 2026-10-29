# 1) Actualiza next (dependencia directa) en todos los apps del workspace
pnpm up -r next@16.4.3

# 2) Fuerza la versión también en las transitivas (la que arrastra @stackframe/stack)
#    Añade el override al package.json raíz:
npm pkg set "pnpm.overrides.next=16.4.3"

# 3) Reinstala aplicando el override
pnpm install

# 4) Comprueba que NO quede ninguna 16.2.x y revisa vulnerabilidades
pnpm why next | grep -iE "next@16" | sort -u
pnpm audit --prod

# 5) (opcional) arrastra parches de transitivas que resuelva el audit
pnpm audit --fix || true
pnpm install

# 6) Verifica: type-check + tests por app
pnpm --filter @merkiai/web    exec tsc --noEmit && pnpm --filter @merkiai/web    exec jest
pnpm --filter @merkiai/admin  exec tsc --noEmit && pnpm --filter @merkiai/admin  exec jest
pnpm --filter @merkiai/database exec jest

