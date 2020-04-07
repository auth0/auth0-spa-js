let refreshToken;

const wait: any = time => new Promise(resolve => setTimeout(resolve, time));

export const messageHandler = async ({
  data: { url, timeout, ...opts },
  ports: [port]
}) => {
  let json;
  try {
    const body = JSON.parse(opts.body);
    if (!body.refresh_token && body.grant_type === 'refresh_token') {
      if (!refreshToken) {
        throw new Error(
          'The web worker is missing the refresh token, you need to get it using the authorization_code grant_type first'
        );
      }
      opts.body = JSON.stringify({ ...body, refresh_token: refreshToken });
    }

    const abortController = new AbortController();
    const { signal } = abortController;
    const response = await Promise.race([
      wait(timeout),
      fetch(url, { ...opts, signal })
    ]);
    if (!response) {
      // If the request times out, abort it and let `fetchWithTimeout` raise the error.
      abortController.abort();
      return;
    }

    json = await response.json();

    if (json.refresh_token) {
      refreshToken = json.refresh_token;
      delete json.refresh_token;
    } else {
      refreshToken = null;
    }

    port.postMessage({
      ok: response.ok,
      json
    });
  } catch (error) {
    port.postMessage({
      ok: false,
      json: {
        error_description: error.message
      }
    });
  }
};

// @ts-ignore
addEventListener('message', messageHandler); // TODO: if testing don't execute this line
