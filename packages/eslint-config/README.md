# packages/eslint-config

**Shared ESLint configurations for all apps and packages in the monorepo.**


## Configs

| Config | Used by |
|--------|---------|
| `base.js` | All TypeScript packages |
| `next.js` | `apps/web` |
| `react-internal.js` | Internal React packages |


## Usage

In any `eslint.config.js` within the monorepo:

```js
import { config } from "@repo/eslint-config/next";
export default config;
```
