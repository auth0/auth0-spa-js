let refreshToken;

// TODO abort after timeout
export const messageHandler = async ({
  data: { url, ...opts },
  ports: [port]
}) => {
  try {
    const body = JSON.parse(opts.body);
    if (!body.refresh_token && body.grant_type === 'refresh_token') {
      if (!refreshToken) {
        throw new Error(
          'The web worker is missing the refresh token, you need to get it using the authorization_code grant_type first'
        );
      }
      opts.body = JSON.stringify(
        Object.assign(body, { refresh_token: refreshToken })
      );
    }

    const response = await fetch(url, opts);
    const json = await response.json();

    if (json.refresh_token) {
      refreshToken = json.refresh_token;
      delete json.refresh_token;
    }

    port.postMessage({
      ok: response.ok,
      json
    });
  } catch (error) {
    port.postMessage({ error: error.message });
  }
};

// @ts-ignore
addEventListener('message', messageHandler); // TODO: if testing don't execute this line
