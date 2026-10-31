# APEX documentation

The [project README](../README.md) is the two-minute overview. These pages are the detail: how APEX works, why it is built this way, and how to run and maintain it.

| Page | Read it to… |
|---|---|
| [Architecture](architecture.md) | understand the system: diagram, request flows, frontend structure, data sources, caching |
| [API reference](api.md) | call or change a serverless endpoint: parameters, responses, errors, limits |
| [Setup & deployment](setup-and-deployment.md) | run it locally, configure environment variables, deploy to Vercel |
| [Testing & CI](testing.md) | see what is tested and why, run the suites, understand the pipeline |
| [Security](security.md) | see the threats considered and how each is handled |
| [Decisions](decisions.md) | find out why something is the way it is (short decision records) |
| [Maintenance](maintenance.md) | do routine jobs: refresh snapshot data, rotate keys, fix common failures |

Conventions used throughout: paths are relative to the repository root; "upstream" means a third-party API; "the CDN" is Vercel's edge cache.
