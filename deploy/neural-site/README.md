# NeuralNg site deployment

The production site runs as the unprivileged `neuralng-deploy` user from immutable releases under `/opt/neuralng/releases`. Nginx is the only public listener; the Node SSR server binds to `127.0.0.1:4010`.

## Continuous deployment

`CI` builds and uploads `dist/apps/neural-site` only after a successful push build on `main`. `Deploy NeuralNg site` then downloads that exact artifact, uploads it with the dedicated SSH key, health-checks it on port `4011`, atomically changes `/opt/neuralng/current`, and activates it through the fixed systemd path unit.

Add `[skip deploy]` anywhere in the final commit message to run the complete CI pipeline without deploying its production artifact. GitHub's standard `[skip ci]` marker skips both CI and deployment, so reserve it for changes that do not need validation.

The repository must contain the Actions secret `NEURALNG_DEPLOY_KEY` and the
repository variables `NEURALNG_DEPLOY_HOST` and
`NEURALNG_DEPLOY_HOST_KEY`. The deploy secret is the private half of the
dedicated key whose public half is the only key authorized for
`neuralng-deploy`; it is not a root or sudo credential. Keep origin addressing
in repository settings instead of committed workflow source.

If activation fails, `deploy-neuralng` restores the previous `current` symlink and asks systemd to restart the previous release.

## Cloudflare TLS

Use Cloudflare Origin CA with SSL/TLS mode **Full (strict)**. The origin private key remains at `/etc/ssl/cloudflare/neuralng-origin.key`; create the certificate from its CSR and install the returned PEM certificate as `/etc/ssl/cloudflare/neuralng-origin.crt`.

After the certificate is installed, replace the HTTP-only Nginx site with `neuralng.cloudflare.conf`, install `cloudflare-realip.conf` as `/etc/nginx/snippets/neuralng-cloudflare-realip.conf`, run `nginx -t`, and reload Nginx. The DNS records for `neuralng.dev` and `www.neuralng.dev` must remain proxied through Cloudflare.

Cloudflare proxy networks can change. Compare `cloudflare-realip.conf` with the official IPv4 and IPv6 lists during infrastructure maintenance.
