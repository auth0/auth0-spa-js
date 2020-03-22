import fetch from 'unfetch';

addEventListener('message', async ({ data: [url, opts] }) => {
  console.log('fetch', url, opts);

  const response = await fetch(url, opts);
  const json = await response.json();

  // TODO: remove/store refresh_token

  // @ts-ignore Need separate tsconfig https://github.com/microsoft/vscode/issues/90642
  postMessage([response.ok, json]);
});
