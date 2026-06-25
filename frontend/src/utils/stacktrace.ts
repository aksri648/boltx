/**
 * Cleans sandbox proxy URLs from stack traces to show relative paths instead
 */
export function cleanStackTrace(stackTrace: string): string {
  const cleanUrl = (url: string): string => {
    const regex = /^https?:\/\/[^\/]+\.(webcontainer-api|proxy\.daytona)\.io(\/.*)?$/;

    if (!regex.test(url)) {
      return url;
    }

    const pathRegex = /^https?:\/\/[^\/]+\.(?:webcontainer-api|proxy\.daytona)\.io\/(.*?)$/;
    const match = url.match(pathRegex);

    return match?.[1] || '';
  };

  return stackTrace
    .split('\n')
    .map((line) => {
      return line.replace(/(https?:\/\/[^\/]+\.(?:webcontainer-api|proxy\.daytona)\.io\/[^\s\)]+)/g, (match) => cleanUrl(match));
    })
    .join('\n');
}
